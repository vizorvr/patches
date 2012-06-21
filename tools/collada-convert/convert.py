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

if output_dir[len(output_dir)-1] == '/':
	output_dir = output_dir[:-1]

output_dir = os.path.expanduser(output_dir)
 
def ensure_dir(f):
	print 'Output to ' + f + ' (exists = ' + str(os.path.exists(f)) + ').'
	
	if not os.path.exists(f):
		print '\t* Doesn\'t exist, creating...'
		os.makedirs(f)

ensure_dir(output_dir)
	
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
		if mat.name == name:
			return mat
		
	return None

def fmt(f32):
	return '%f' % f32

def is_black(c):
	return c[0] == 0.0 and c[1] == 0.0 and c[2] == 0.0 and c[3] == 1.0

def write_mat_attr(delim, attr, attr_name, write_col):
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
			while ow2 > 1 and oh2 > 1 and (ow2 > 9 or oh2 > 9):
				ow2 = ow2 - 1
				oh2 = oh2 - 1
			
			if ow2 > 9:
				ow2 = 9
			
			if oh2 > 9:
				oh2 = 9
			
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
	elif type(attr) is tuple and write_col(attr):
		o.write(delim + '                "' + attr_name + '_color": [%f,%f,%f,%f]' % (attr[0], attr[1], attr[2], attr[3]))
		delim = ',\n'
	
	return delim


def write_material(mat):
	effect = mat.effect
	shine = getattr(mat.effect, 'shininess')
	
	o.write('            "material": {\n')
	
	delim = ''
	delim = write_mat_attr(delim, getattr(mat.effect, 'diffuse'), 'diffuse', lambda c: True)
	delim = write_mat_attr(delim, getattr(mat.effect, 'emission'), 'emission', lambda c: not is_black(c))
	delim = write_mat_attr(delim, getattr(mat.effect, 'specular'), 'specular', lambda c: shine)
	delim = write_mat_attr(delim, getattr(mat.effect, 'bumpmap'), 'bump', lambda c: False)
	# delim = write_mat_attr(delim, getattr(mat.effect, 'normalmap'), 'normal', lambda c: False)
	
	attr = getattr(mat.effect, 'ambient')
	
	if type(attr) is tuple and not is_black(attr):
		o.write(delim + '                "ambient_color": [%f,%f,%f,%f]' % (attr[0], attr[1], attr[2], attr[3]))
		delim = ',\n'
	
	if shine:
		o.write(delim + '                "shininess": %f' % shine)
		delim = ',\n'
	
	o.write(delim + '                "double_sided": %s\n' % str(mat.effect.double_sided).lower())
	o.write('            }')

mesh_delim = ''
scene_bounds = [[9999999.0, 9999999.0, 9999999.0], [-9999999.0, -9999999.0, -9999999.0]]

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
			
			for i in range(3):
				if f_v[i] < scene_bounds[0][i]:
					scene_bounds[0][i] = f_v[i]
			
				if f_v[i] > scene_bounds[1][i]:
					scene_bounds[1][i] = f_v[i]
			
			# Disable normals to save size for now. Or recompute them at load time.
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
	
o.write('    ],\n')
o.write('    "bounding_box":\n')
o.write('    {\n')
o.write('        "lo": [%f, %f, %f],\n' % (scene_bounds[0][0], scene_bounds[0][1], scene_bounds[0][2]))
o.write('        "hi": [%f, %f, %f]\n' % (scene_bounds[1][0], scene_bounds[1][1], scene_bounds[1][2]))
o.write('    }\n')
o.write('}\n')

print 'Wrote %d vertices, %d normals and %d tex coords.' % (v_count, n_count, uv_count)
print 'Bounds: ' + str(scene_bounds[0]) + ' - ' + str(scene_bounds[1])
