# Part of the Cogent-WebGL suite.
# No rights reserved. Do what thou wilt shall be the whole of the law.

from bpy.props import *
from bpy_extras.io_utils import ExportHelper
from mathutils import *
from functools import reduce
import os, os.path, bpy, bmesh, math, struct, base64

bl_info = {
    'name': 'Cogent Export (.json)',
    'author': 'Lasse Nielsen',
    'version': (0, 1),
    'blender': (2, 63, 17),
    'location': 'File > Export > Cogent (.json)',
    'description': 'Cogent Export (.json)',
    'url': 'http://www.effekts.dk',
    'category': 'Import-Export'
}

# Compress number representation to save as much space as possible. We could really
# use support for 8 bit mesh compression. We'd need to subpartition into many more batches
# for that to make practical sense though. 16 bit doesn't really make as much sense in
# an ASCII representation.
def cnr(n):
    s = '%.4f' % n

    while s[-1] == '0':
        s = s[:-1]

    if s[-1] == '.':
        s = s[:-1]

    return s


def format_stream(ident, id, s):
    return '%s%s: [%s]' % (ident, id, ','.join(map(str, s)))

class CogentContext:
    def __init__(self, scene, directory):
        self.scene = scene
        self.directory = directory
        self.world = scene.world
        self.world_amb = Color((0, 0, 0))
        self.material_cache = CogentMaterialCache()
        self.unique_textures = {}
        self.render_settings = bpy.data.scenes.new('CogentRenderSettings') # Dummy scene with custom render settings used for resaving textures.
        
        self.render_settings.render.resolution_percentage = 100
        
        for img in bpy.data.images:
            if not img.filepath:
                continue
            
            if img.name in self.unique_textures: 
                continue
            
            print('Caching unique texture [%s]' % img.name)
            
            fn = os.path.abspath(img.filepath)
            
            if not img.packed_file and not os.path.exists(fn):
                print('[Error]: Failed to find referenced texture \'%s\'' % fn)
                continue
            
            self.unique_textures[img.name] = { 'filename': fn, 'outfn': '', 'width': img.size[0], 'height': img.size[1], 'used': False, 'image': img, 'alpha': None }
        
        if self.world:
            self.world_amb = self.world.ambient_color
    
    def process_textures(self):
        rs = self.render_settings.render
        
        for img in self.unique_textures:
            img = self.unique_textures[img]
            
            if not img['used']:
                continue
            
            ow = math.floor(math.log(img['width']) / math.log(2))
            oh = math.floor(math.log(img['height']) / math.log(2))
            
            # Reduce to at most 512 and at minumum 2 pixels on any axis, unless the
            # aspect ratio is too extreme in which case we clip to 512, aspect be damned.
            while ow > 1 and oh > 1 and (ow > 9 or oh > 9):
                ow = ow - 1
                oh = oh - 1
                
            ow = int(math.pow(2, ow))
            oh = int(math.pow(2, oh))
            
            ext = '.jpg'
            
            if img['image'].depth != 24 or img['alpha']: # Convert all 24bpp images to JPEG, everything else to PNG
                ext = '.png'
                rs.image_settings.file_format = 'PNG'
            else:
                rs.image_settings.file_format = 'JPEG'
            
            # This is slightly tricky. To find out whether the alpha channel of this 
            # image is in use, we have to traverse all referencing textures and check
            # the state of their 'Use Alpha' flag. There's got to be a better way.
            
            img['outfn'] = os.path.splitext(os.path.split(img['filename'])[1])[0] + ext
            out_filename = self.directory + img['outfn']
            
            print('Texture("%s", %dx%d) -> ("%s", %dx%d)' %  (img['filename'], img['width'], img['height'], out_filename, ow, oh))
            
            imgc = img['image'].copy()
            imgc.scale(ow, oh)
            
            rs.filepath = out_filename
            imgc.save_render(out_filename, self.render_settings)
            
    def clean_up(self):
        bpy.data.scenes.remove(self.render_settings)
                        

class CogentMaterialCache:
    def __init__(self):
        self.materials = {}
        
    def add(self, ctx, mat, mesh):
        if mat.name not in self.materials:
            self.materials[mat.name] = CogentMaterial(ctx, mat, mesh)
        
        return self.materials[mat.name]
    
    def serialise(self):
        json = '\t"materials": {\n'
        delim = ''
        
        for m in self.materials:
            json += '%s%s' % (delim, self.materials[m].serialise())
            delim = ',\n'
        
        json += '\n\t},\n'
        
        return json

class CogentMaterial:
    def __init__(self, ctx, mat, mesh):
        self.ctx = ctx
        self.material = mat
        self.mesh = mesh
        
        def tag_map(ctx, ts):
            img = ts.texture.image
            url = os.path.split(img.filepath[2:])[1]
            
            if img.name in ctx.unique_textures:
                ctx.unique_textures[img.name]['used'] = True
            else:
                print('Error: "%s" - no such texture found in image cache. This shouldn\'t happen unless Blender is broken.' % img.name)
                    
        # Mark all referenced textures as in use.
        for ts in self.material.texture_slots:
            if not ts or not ts.texture or not ts.texture.image:
                continue
            
            tag_map(self.ctx, ts)
    
    def serialise(self):
        m = self.material
        json = ''
        json += '\t\t\t"%s": {\n' % m.name
        amb = [0, 0, 0]
        d = { 'r': 1.0, 'g': 1.0, 'b': 1.0 }
        di = 1.0
        alpha = 1.0
        
        if m.alpha:
            alpha = m.alpha
            
        if m.diffuse_color:
            d = m.diffuse_color
            di = m.diffuse_intensity
                
        amb = m.ambient * self.ctx.world_amb
        
        json += '\t\t\t\t"ambient_color": [%s, %s, %s, 1],\n' % (cnr(amb[0]), cnr(amb[1]), cnr(amb[2]))
        json += '\t\t\t\t"diffuse_color": [%s, %s, %s, %s],\n' % (cnr(d.r * di), cnr(d.g * di), cnr(d.b * di), cnr(alpha))
        json += '\t\t\t\t"double_sided": %s' % (str(self.mesh.show_double_sided).lower())
        uvi = 0
        
        def format_map(name, factor, ctx, ts):
            img = ts.texture.image
            
            if img.name in ctx.unique_textures:
                data = ctx.unique_textures[img.name]
                return ',\n\t\t\t\t"%s_map": { "factor": %s, "url": "%s" }' % (name, cnr(factor), data['outfn'])
            else:
                print('Error: Failed to find unique texture by name: [%s]' % img.name)
            
            return ''
	        
        for ts in self.material.texture_slots:
            if not ts or not ts.texture or not ts.texture.image:
                continue
            
            # We cannot support using a single map for multiple things, although the
            # same texture image may be used for different mapping, provided a texture
            # slot per mapping is used.
            #if ts.use_map_alpha:
            #    json += format_map('alpha', ts.alpha_factor, self.ctx, ts)
            if ts.use_map_color_diffuse:
                json += format_map('diffuse_color', ts.diffuse_color_factor, self.ctx, ts)
                
                if ts.use_map_alpha:
                    img = ts.texture.image_settings
                    
                    self.ctx.unique_textures[img.name].alpha = img 
            elif ts.use_map_emission:
                json += format_map('emission_intensity', ts.emission_factor, self.ctx, ts)
            elif ts.use_map_specular:
                json += format_map('specular_intensity', ts.specular_factor, self.ctx, ts)
            elif ts.use_map_color_spec:
                json += format_map('specular_color', ts.specular_color_factor, self.ctx, ts)
            elif ts.use_map_color_emission:
                json += format_map('emission_color', ts.emission_color_factor, self.ctx, ts)
            elif ts.use_map_normal:
                json += format_map('normal', ts.normal_factor, self.ctx, ts)
                    
        json += '\n\t\t\t}'
        
        return json

class CogentBatch:
    def __init__(self, ctx, mat, mesh, polygons):
        self.ctx = ctx
        self.material = ctx.material_cache.add(ctx, mat, mesh)
        self.verts = []
        self.norms = []
        self.uvs = [[], [], [], []]
        self.bb_lo = [9999999.0, 9999999.0, 9999999.0]
        self.bb_hi = [-9999999.0, -9999999.0, -9999999.0]
        
        for poly in polygons:
            for v in [mesh.vertices[v] for v in list(poly.vertices)]:
                self.verts.append(v)
                
                self.bb_lo[0] = v.co[0] if v.co[0] < self.bb_lo[0] else self.bb_lo[0]
                self.bb_lo[1] = v.co[1] if v.co[1] < self.bb_lo[1] else self.bb_lo[1]
                self.bb_lo[2] = v.co[2] if v.co[2] < self.bb_lo[2] else self.bb_lo[2]
                
                self.bb_hi[0] = v.co[0] if v.co[0] > self.bb_hi[0] else self.bb_hi[0]
                self.bb_hi[1] = v.co[1] if v.co[1] > self.bb_hi[1] else self.bb_hi[1]
                self.bb_hi[2] = v.co[2] if v.co[2] > self.bb_hi[2] else self.bb_hi[2]
                
                if poly.use_smooth: # Use vertex normals, if available.
                    self.norms.append(v.normal)
                else: # Use face normals otherwise.
                    self.norms.append(poly.normal)
            
            uvi = 0
            
            for uvl in mesh.uv_layers:
                for uv in [uvl.data[v] for v in poly.loop_indices]:
                    self.uvs[uvi].append(uv)
                
                uvi += 1
                
                if uvi == 4: # We can only support four concurrent textures.
                    break
        
        # Flatten streams to interleaved lists of floats
        def flatten(list):
            return [i for sl in list for i in sl]
        
        self.verts = flatten(map(lambda v: [v.co[0], v.co[1], v.co[2]], self.verts))
        self.norms = flatten(map(lambda n: [n[0], n[1], n[2]], self.norms))
        
        for idx in range(4):
            uv = self.uvs[idx]
            
            if len(uv) > 0:
                uv = flatten(map(lambda v: [v.uv[0], v.uv[1]], uv))
                self.uvs[idx] = uv
            
    def serialise(self):
        json = '\t\t\t\t{\n'
        json += '\t\t\t\t\t"material": "%s"' % self.material.material.name
        
        def serialise_stream(stream):
            return '[' + ','.join(map(cnr, stream)) + ']'
            #return '"' + base64.b64encode(struct.pack('f' * len(stream), *stream)).decode('utf-8') + '"'
        
        ident = ',\n\t\t\t\t\t'
        json += '%s"vertices": %s' % (ident, serialise_stream(self.verts))
        json += '%s"normals": %s' % (ident, serialise_stream(self.norms))
        
        for idx in range(4):
            uv = self.uvs[idx]
            
            if len(uv) > 0:
                json += '%s"uv%d": %s' % (ident, idx, serialise_stream(uv))
            
        json += '\n\t\t\t\t}'
        return json

class CogentMesh:
    def __init__(self, ctx, obj, mesh):
        self.ctx = ctx
        self.obj = obj
        self.mesh = mesh
        self.batches = []
        self.bb_lo = [9999999.0, 9999999.0, 9999999.0]
        self.bb_hi = [-9999999.0, -9999999.0, -9999999.0]
        
        materials = {}
        mats = mesh.materials
        
        if mats.keys(): # Do we have any materials at all?
            """Create a unique set of referenced materials 
               so we can pre-split the mesh into batches by 
               material"""
            for poly in mesh.polygons:
                if mats[poly.material_index] not in materials:
                    materials[poly.material_index] = mats[poly.material_index]
        
        # Create material batches
        for i in materials:
            polys = []
            
            for poly in mesh.polygons:
                if poly.material_index == i:
                    polys.append(poly)
            
            b = CogentBatch(ctx, materials[i], mesh, polys)
            
            self.bb_lo[0] = b.bb_lo[0] if b.bb_lo[0] < self.bb_lo[0] else self.bb_lo[0]
            self.bb_lo[1] = b.bb_lo[1] if b.bb_lo[1] < self.bb_lo[1] else self.bb_lo[1]
            self.bb_lo[2] = b.bb_lo[2] if b.bb_lo[2] < self.bb_lo[2] else self.bb_lo[2]

            self.bb_hi[0] = b.bb_hi[0] if b.bb_hi[0] > self.bb_hi[0] else self.bb_hi[0]
            self.bb_hi[1] = b.bb_hi[1] if b.bb_hi[1] > self.bb_hi[1] else self.bb_hi[1]
            self.bb_hi[2] = b.bb_hi[2] if b.bb_hi[2] > self.bb_hi[2] else self.bb_hi[2]
            
            self.batches.append(b)
    
    def serialise(self):
        json = '\t\t"%s": {\n' % self.obj.name
        json += '\t\t\t"batches": [\n'
        
        b_delim = ''
        
        for batch in self.batches:
                json += '%s%s' % (b_delim, batch.serialise())
                b_delim = ',\n'
        
        json += '\n\t\t\t]\n\t\t}'
        return json
        

def sanitize_name(name):
    name = name.replace('.', '_')
    name = name.replace('-', '_')
    name = name.replace('"', '')
    return name


class JSONExporter(bpy.types.Operator, ExportHelper):
    bl_idname = 'export.json'
    bl_label = 'Export Cogent (.json)'
    bl_options = {'PRESET'}
    filename_ext = ".json"
    filter_glob = StringProperty(default="*.json", options={'HIDDEN'})

    #filepath = StringProperty()
    filename = StringProperty()
    directory = StringProperty()
    
    # Black Magic...
    check_extension = True
    
    def execute(self, context):
        world_amb = Color((0.0, 0.0, 0.0))
        filename = os.path.splitext(self.filename)[0] + '.json'
        print('Target path = %s' % (self.directory + filename)) 
        bb_lo = None
        bb_hi = None
        
        scene = bpy.context.scene # Export the active scene
        ctx = CogentContext(scene, self.directory)
        
        mjson = ''
        json = ''
        json += '{\n'
        json += '\t"id": "%s",\n' % sanitize_name(filename) 
        
        mjson += '\t"meshes": {\n'
        delim = ''
        
        for i in scene.objects:
            i.select = False # deselect all objects
        
        for obj in bpy.data.objects:
            if obj.type == 'MESH':
                # Copy the object temporarily, so we can maniulate the copy prior
                # to export, without altering the original scene.
                objc = obj.copy()
                objc.data = objc.to_mesh(scene, True, 'PREVIEW')
                scene.objects.link(objc)
                scene.update()
                
                objc.select = True
                scene.objects.active = objc
                
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='SELECT')
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.quads_convert_to_tris()
                bpy.ops.mesh.faces_shade_smooth()
                scene.update()
                
                bpy.ops.object.mode_set(mode='OBJECT')
                objc.data = objc.to_mesh(scene, True, 'PREVIEW') #write data object
                scene.update()
                
                mesh = objc.data
                
                # Transform from local to world space.
                mesh.transform(obj.matrix_world)
                mesh.update()
                
                cmesh = CogentMesh(ctx, obj, mesh)
                
                # Remove the temporary object
                scene.objects.unlink(objc)
                scene.update()
                
                if len(cmesh.batches) < 1:
                    continue
                
                # Update bounds
                bbl = cmesh.bb_lo
                bbh = cmesh.bb_hi
                
                if not bb_lo:
                    bb_lo = list(bbl)
                else:
                    for i in range(3):
                        bb_lo[i] = bbl[i] if bbl[i] < bb_lo[i] else bb_lo[i]
                
                if not bb_hi:
                    bb_hi = list(bbh)
                else:
                    for i in range(3):
                        bb_hi[i] = bbh[i] if bbh[i] > bb_hi[i] else bb_hi[i]

                mjson += '%s%s' % (delim, cmesh.serialise())
                delim = ',\n'
        
        mjson += '\n\t},'
        mjson += '\n\t"bounding_box": { "lo": [' + cnr(bb_lo[0]) + ', ' + cnr(bb_lo[1]) + ', ' + cnr(bb_lo[2]) + '], "hi": [' + cnr(bb_hi[0]) + ', ' + cnr(bb_hi[1]) + ', ' + cnr(bb_hi[2]) + '] }\n';
        
        ctx.process_textures()
        
        # Write the material cache
        json += ctx.material_cache.serialise()
        
        # Append the meshes
        json += mjson
        
        json += '}\n'
        
        f = open(self.directory + filename, 'w')
            
        if not f: 
            raise ('Could not open file for writing.')
        
        f.write(json)
        f.close()
        
        ctx.clean_up()
        
        return {'FINISHED'}

def menu_func(self, context):
    self.layout.operator(JSONExporter.bl_idname, text="Cogent (.json)")


def register():
    bpy.utils.register_class(JSONExporter)
    bpy.types.INFO_MT_file_export.append(menu_func)


def unregister():
    bpy.utils.unregister_class(JSONExporter)
    bpy.types.INFO_MT_file_export.remove(menu_func)


if __name__ == '__main__':
    register()
