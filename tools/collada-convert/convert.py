#!/usr/bin/python
from collada import *
from PIL import Image
import sys
import os
import math

if len(sys.argv) < 3:
	sys.exit('Usage: conv.py <Collada DAE model> <output dir>')

input_filename = sys.argv[1]
output_dir = os.path.abspath(sys.argv[2])
base_path = os.path.split(os.path.abspath(input_filename))[0]

if not os.path.isdir(output_dir):
	sys.exit('Error: The second argument must be an existing directory.')
	
o = open(output_dir + '/scene.json', 'w')

mesh = Collada(input_filename)
v_count = 0
n_count = 0
uv_count = 0
textures = {}

o.write('{\n')
o.write('    "id": "' + mesh.scene.id + '",\n')
o.write('    "meshes": [\n')

def get_material(name):
	for mat in mesh.materials:
		if mat.id[:-2] == name:
			return mat
	
	return None

def fmt(f32):
	return '%f' % f32

def write_mat_attr(delim, attr, attr_name):
	if isinstance(attr, material.Map):
		rel_path = attr.sampler.surface.image.path
		tex_fname = os.path.split(rel_path)[1]
		tex_in_path = os.path.abspath(base_path + '/' + rel_path)
		tex_out_path = output_dir + '/' + tex_fname
	
		o.write(delim + '                "' + attr_name + '_tex": "' + tex_fname + '"')
		delim = ',\n'
		
		if not tex_fname in textures:
			tex = Image.open(tex_in_path)
			ow2 = math.floor(math.log(tex.size[0]) / math.log(2))
			oh2 = math.floor(math.log(tex.size[1]) / math.log(2))
			
			# Reduce to at most 256 and at minumum 2 pixels on any axis, unless the
			# aspect ratio is too extreme in which case we clip to 256, apect be damned.
			while ow2 > 1 and oh2 > 1 and (ow2 > 8 or oh2 > 8):
				ow2 = ow2 - 1
				oh2 = oh2 - 1
			
			if ow2 > 8:
				ow2 = 8
			
			if oh2 > 8:
				oh2 = 8
			
			ow = int(math.pow(2, ow2))
			oh = int(math.pow(2, oh2))
			
			if ow != tex.size[0] or oh != tex.size[1]: 
				print 'Resizing %s(%dx%d) -> (%dx%d)' % (tex_in_path, tex.size[0], tex.size[1], ow, oh)
				tex = tex.transform((ow, oh), Image.EXTENT, (0, 0, tex.size[0], tex.size[1]), Image.BICUBIC);
			else:
				print 'Copying to %s(%dx%d)' % (tex_out_path, ow, oh)
			
			ospl = os.path.splitext(tex_out_path)
			
			if ospl[1].lower() == '.png':
				tex.save(tex_out_path, 'PNG')
			else:
				tex.save(tex_out_path, 'JPEG')
			
			textures[tex_fname] = True
	elif type(attr) is tuple:
		o.write(delim + '                "' + attr_name + '_color": [%f,%f,%f,%f]' % (attr[0], attr[1], attr[2], attr[3]))
		delim = ',\n'
	
	return delim


def write_material(mat):
	effect = mat.effect
	
	o.write('            "material": {\n')
	
	delim = ''
	delim = write_mat_attr(delim, getattr(mat.effect, 'diffuse'), 'diffuse')
	delim = write_mat_attr(delim, getattr(mat.effect, 'emission'), 'emission')
	delim = write_mat_attr(delim, getattr(mat.effect, 'specular'), 'specular')
	delim = write_mat_attr(delim, getattr(mat.effect, 'bumpmap'), 'normal')
	
	attr = getattr(mat.effect, 'ambient')
	
	if type(attr) is tuple:
		o.write(delim + '                "ambient_color": [%f,%f,%f,%f]' % (attr[0], attr[1], attr[2], attr[3]))
		delim = ',\n'
	
	shine = getattr(mat.effect, 'shininess')
	
	if shine:
		o.write(delim + '                "shininess": %f' % shine)
		delim = ',\n'
	
	o.write(delim + '                "double_sided": %s\n' % str(mat.effect.double_sided).lower())
	o.write('            }')

mesh_delim = ''

for geom in mesh.geometries:
	for prim in geom.primitives:
		prim_type = type(prim)
		triset = None
		
		if prim_type is triangleset.TriangleSet:
			triset = prim
		elif prim_type is polylist.Polylist or prim_type is polygons.Polygons:
			triset = prim.triangleset()
			
		if triset:
			if triset.normal is None:
				triset.generateNormals()
			
			f_v = triset.vertex[triset.vertex_index]
			f_v.shape = (-1)
			
			o.write(mesh_delim + '        {\n')
			mesh_delim = ',\n'
			
			mat = get_material(prim.material)
			delim = ''
			
			if mat:
				write_material(mat)
				delim = ',\n'
				
			o.write(delim + '            "verts": [')
			delim = ',\n'
			o.write(','.join(fmt(v) for v in f_v) + ']')
			v_count = v_count + (len(f_v) / 3)
			
			# Disable normals to save size for now.
			# f_n = triset.normal[triset.normal_index]
			# f_n.shape = (-1)
			# 
			# o.write(delim + '            "norms": [')	
			# o.write(','.join(fmt(n) for n in f_n) + ']')
			# n_count = n_count + (len(f_n) / 3)
			
			uv_set_count = len(triset.texcoordset)
			
			if uv_set_count > 0:
				if uv_set_count > 4:
					uv_set_count = 4;
				
				for set_idx in range(uv_set_count):
					f_uv = triset.texcoordset[set_idx][triset.texcoord_indexset[set_idx]]
					f_uv.shape = (-1)
			
					o.write(delim + '            "uv' + str(set_idx) + '": [')
					o.write(','.join(fmt(uv) for uv in f_uv) + ']')
					uv_count = uv_count + (len(f_uv) / 2)
			
			o.write('\n        }')
		#else:
		#	print 'Warning: Skipping unhandled primitive type \'' + prim_type.__name__ + '\''
	
o.write('    ]\n')
o.write('}\n')
print 'Wrote %d vertices, %d normals and %d tex coords.' % (v_count, n_count, uv_count)
