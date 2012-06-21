#!/usr/bin/python
from pyassimp import pyassimp
import os
import sys
from PIL import Image
import math

if len(sys.argv) < 3:
	sys.exit('Usage: convert.py <input model> <output dir>')

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
scene = None

print 'Loading ' + input_filename

process = 0

# process = process | 0x2 # JoinIdenticalVertices
process = process | 0x8 # Triangulate
process = process | 0x100 # PretransformVertices (bake graph transforms, remove anmations)
process = process | 0x400 # ValidateDataStructure
process = process | 0x800 # ImproveCacheLocality
process = process | 0x1000 # RemoveRudendantMaterials
process = process | 0x1000 # RemoveRudendantMaterials
process = process | 0x2000 # FixInfacingNormals
process = process | 0x8000 # SortByPType
process = process | 0x10000 # FindDegenerates
process = process | 0x40000 # GenUVCoords - ake mapping functions as explicit coordinates.
process = process | 0x80000 # PretransformUVCoords
process = process | 0x200000 #OptimizeMeshes

scene = pyassimp.load(input_filename, process) # , process

o.write('{\n')
o.write('    "meshes": [\n')

textures = {}

def process_texture(filename):
	tex_fname = os.path.split(filename)[1]
	tex_in_path = os.path.abspath(base_path + '/' + filename)
	tex_out_path = output_dir + '/' + tex_fname.lower()
	
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
		return tex_fname.lower()

def get_mat_prop(props, name):
	if name in props:
		return props[name]
		
	return None
	

def write_material(mat):
	props = pyassimp.GetMaterialProperties(mat)
	delim = ''
	
	o.write('\n            "material": {\n')
	
	diffuse = get_mat_prop(props, '$clr.diffuse')
	
	if diffuse:
		opacity = get_mat_prop(props, '$mat.opacity')
		
		if not opacity:
			opacity = [1.0]
		
		o.write(delim + '                "diffuse_color": [%f,%f,%f,%f]' % (diffuse[0], diffuse[1], diffuse[2], opacity[0]))
		delim = ',\n'
		
	ambient = get_mat_prop(props, '$clr.ambient')
	
	if ambient:
		o.write(delim + '                "ambient_color": [%f,%f,%f,1.0]' % (ambient[0], ambient[1], ambient[2]))
		delim = ',\n'
		
	d_tex = get_mat_prop(props, '$tex.file')
	
	if d_tex:
		o.write(delim + '                "diffuse_tex": "%s"' % process_texture(d_tex))
		delim = ',\n'
		
	shine = get_mat_prop(props, '$mat.shininess')
	
	if shine:
		o.write(delim + '                "shininess": %f' % shine[0])
		
	
	o.write('\n            }')

mesh_delim = ''
scene_bounds = [[9999999.0, 9999999.0, 9999999.0], [-9999999.0, -9999999.0, -9999999.0]]

for index, mesh in enumerate(scene.meshes):
	delim = ''
	
	o.write(mesh_delim + '        {\n')
	delim = ',\n'

	write_material(scene.materials[mesh.mMaterialIndex])
	
	o.write(delim + '            "verts": [\n')
	
	for v in mesh.vertices:
		for i in range(3):
			if v[i] < scene_bounds[0][i]:
				scene_bounds[0][i] = v[i]
	
			if v[i] > scene_bounds[1][i]:
				scene_bounds[1][i] = v[i]
		
	o.write(','.join([str(v) for sv in mesh.vertices for v in sv]) + ']')
	
	for i in xrange(4):
		if mesh.mNumUVComponents[i] > 0:
			ident = 'uv' + str(i)
			o.write(delim + '            "%s": [\n' % ident)
			o.write(','.join([str(sv[0])+','+str(sv[1]) for sv in mesh.texcoords[i]]) + ']')
		
	
	o.write('\n        }')
	mesh_delim = ',\n'	
	

o.write('\n    ],\n')
o.write('    "bounding_box":\n')
o.write('    {\n')
o.write('        "lo": [%f, %f, %f],\n' % (scene_bounds[0][0], scene_bounds[0][1], scene_bounds[0][2]))
o.write('        "hi": [%f, %f, %f]\n' % (scene_bounds[1][0], scene_bounds[1][1], scene_bounds[1][2]))
o.write('    }\n')
o.write('}\n')

pyassimp.release(scene)
