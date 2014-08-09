# Part of the Engi-WebGL suite.

from bpy.props import *
from bpy_extras.io_utils import ExportHelper
from mathutils import *
from functools import reduce
import os, sys, os.path, bpy, bmesh, math, struct, base64, itertools

bl_info = {
	'name': 'Curve Export (.json)',
	'author': 'Lasse Nielsen',
	'version': (0, 1),
	'blender': (2, 63, 17),
	'location': 'File > Export > Curve (.json)',
	'description': 'Curve Export (.json)',
	'url': 'http://www.engine.gl',
	'category': 'Import-Export'
}

# Compress number representation to save as much space as possible.
def cnr(n):
	s = '%.4f' % n
	
	while s[-1] == '0':
		s = s[:-1]
	
	if s[-1] == '.':
		s = s[:-1]
	
	return s

def format_stream(ident, id, s):
	return '%s%s: [%s]' % (ident, id, ','.join(map(cnr, s)))
        
class EngiCurveExporter(bpy.types.Operator, ExportHelper):
	bl_idname = 'curve.json'
	bl_label = 'Export Curve (.json)'
	bl_options = {'PRESET'}
	filename_ext = ".json"
	
	filter_glob = StringProperty(default="*.json", options={'HIDDEN'})
	
	#filepath = StringProperty()
	filename = StringProperty()
	directory = StringProperty()
	
	# Black Magic...
	check_extension = True
	
	def execute(self, context):
		filename = os.path.splitext(self.filename)[0]
		filename = filename + '.json'

		# Check for a valid selection. We expect a single object of type 'CURVE'.
		if bpy.context.active_object.type != 'CURVE':
			print('The current selection is invalid. Please select a single curve to export.')
			return {'FINISHED'}
		
		spline = bpy.context.active_object.data.splines[0]
		points = spline.points
		
		json = '{\n'
		json += '\t"count": ' + str(len(points)) + ',\n'
		
		x_stream = []
		y_stream = []
		z_stream = []
		
		for point in points:
			x_stream.append(point.co[0])
			y_stream.append(point.co[1])
			z_stream.append(point.co[2])
		
		json += format_stream('\t', '"x"', x_stream) + ',\n'
		json += format_stream('\t', '"y"', y_stream) + ',\n'
		json += format_stream('\t', '"z"', z_stream) + '\n'
		
		json += '}'
		
		with open(self.directory + filename, 'w') as out:
			out.write(json)
		
		return {'FINISHED'}

def menu_func(self, context):
	self.layout.operator(EngiCurveExporter.bl_idname, text="Curve (.json)")


def register():
	bpy.utils.register_class(EngiCurveExporter)
	bpy.types.INFO_MT_file_export.append(menu_func)


def unregister():
	bpy.utils.unregister_class(EngiCurveExporter)
	bpy.types.INFO_MT_file_export.remove(menu_func)

if __name__ == '__main__':
	register()
