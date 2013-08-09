# Part of the Engi-WebGL suite.

from bpy.props import *
from bpy_extras.io_utils import ExportHelper
from mathutils import *
from functools import reduce
import os, os.path, bpy, bmesh, math, struct, base64

debug = True

bl_info = {
    'name': 'Engi Export (.json)',
    'author': 'Lasse Nielsen',
    'version': (0, 1),
    'blender': (2, 63, 17),
    'location': 'File > Export > Engi (.json)',
    'description': 'Engi Export (.json)',
    'url': 'http://www.engine.gl',
    'category': 'Import-Export'
}

def dbg(msg):
    if debug:
        print(msg)

def sanitize_name(name):
    name = name.replace('.', '_')
    name = name.replace('-', '_')
    name = name.replace('"', '')
    return name

# Compress number representation to save as much space as possible.
def cnr(n):
    s = '%.4f' % n

    while s[-1] == '0':
        s = s[:-1]

    if s[-1] == '.':
        s = s[:-1]

    return s

def format_stream(ident, id, s):
    return '%s%s: [%s]' % (ident, id, ','.join(map(str, s)))

def median_factor(n):
    fact = [1,n]
    check = 2
    rootn = math.sqrt(n)
    
    while check < rootn:
        if n % check==0:
            fact.append(check)
            fact.append(n/check)
            
        check += 1
            
    if rootn == check:
        fact.append(check)
        
    fact.sort()
    return fact[math.floor(len(fact) / 2)]

def get_stream_bounds(stream):
    lo = 0, hi = 0
    
    for v in stream:
        if lo > s:
            lo = s
        
        if hi < s:
            hi = s
    
    return lo, hi

def stream_to_image(ctx, filename, stream, d_stream):
    pixel_count = len(stream)
    
    # Find ideal size
    w = int(median_factor(pixel_count))
    h = int(pixel_count / w)
    
    r_settings = ctx.render_settings.render
    settings = r_settings.image_settings
    
    bpy.data.images.new(name = filename, width = w, height = h)
    img = bpy.data.images[filename]
    
    # img.pixels = [(float(stream[i]) / 255.0) for i in range(w * h)]
    data = []
    
    for y in range(h):
        o = y * w
        for x in range(w):
            l = float(stream[o + x]) / 255.0
            data.extend([l, l, l, 1.0])
        
    img.pixels = data
    print('Stream to image: %s.png (%d x %d, %d) %d %d %d %d %f.' % (filename, w, h, pixel_count, stream[(h - 1) * w], stream[((h - 1) * w) + 1], stream[((h - 1) * w) + 2], stream[((h - 1) * w) + 3], d_stream[0]))
    
    r_settings.alpha_mode = 'STRAIGHT'
    r_settings.use_antialiasing = False
    r_settings.use_compositing = False
    r_settings.use_sequencer = False
    r_settings.resolution_percentage = 100
    
    settings.file_format = 'PNG'
    settings.compression = 100
    settings.color_mode = 'BW'
    
    img.save_render(ctx.base_path + filename + '.png', ctx.render_settings)
    bpy.data.images.remove(img)
    
    # Allow chaining
    return filename

class EngiContext:
    def __init__(self, scene, directory):
        self.scene = scene
        self.directory = directory
        self.world = scene.world
        self.world_amb = Color((0, 0, 0))
        self.material_cache = EngiMaterialCache()
        self.unique_textures = {}
        self.render_settings = bpy.data.scenes.new('EngiRenderSettings') # Dummy scene with custom render settings used for resaving textures.
        self.default_mat = bpy.data.materials.new('EngiDefault')
        self.file_base_name = ''
        self.base_path = ''
        
        self.render_settings.render.resolution_percentage = 100
        
        for img in bpy.data.images:
            if not img.filepath:
                continue
            
            if img.name in self.unique_textures: 
                continue
            
            print('Caching unique texture [%s]' % img.name)
            
            fn = bpy.path.abspath(img.filepath)
            
            if not img.packed_file and not os.path.exists(fn):
                print('[Error]: Failed to find referenced texture \'%s\'' % fn)
                continue
            
            self.unique_textures[img.name] = { 'filename': fn, 'outfn': '', 'width': img.size[0], 'height': img.size[1], 'used': False, 'image': img, 'alpha': None, 'achannel': None }
        
        if self.world:
            self.world_amb = self.world.ambient_color
    
    def process_textures(self):
        rs = self.render_settings.render
        
        for img in self.unique_textures:
            img = self.unique_textures[img]
            
            if not img['used'] or img['image'].users < 1:
                print('Skipping unused texture: ' + img['image'].name)
                continue
                
            ow = math.floor(math.log(img['width']) / math.log(2))
            oh = math.floor(math.log(img['height']) / math.log(2))
            
            if ow < 1 or oh < 1:
                print('Skipping texture with no image data: ' + img['image'].name)
                continue
            
            # Reduce to at most 2048 and minimum 2 pixels on any axis, unless the
            # aspect ratio is too extreme in which case we clip to 2048, aspect be damned. The user was asking for it.
            while ow > 1 and oh > 1 and (ow > 11 or oh > 11):
                ow = ow - 1
                oh = oh - 1
                
            ow = int(math.pow(2, ow))
            oh = int(math.pow(2, oh))
            
            ext = '.jpg'
            
            # img['image'].depth != 24 or (
            if self.merge_alpha and img['alpha']: # Convert all 24bpp images to JPEG, everything else to PNG
                ext = '.png'
                rs.image_settings.file_format = 'PNG'
                rs.image_settings.color_mode = 'RGBA'
                img['achannel'] = True
                print('Texture has alpha, switching to PNG: ' + img['image'].name)
            else:
                rs.image_settings.color_mode = 'RGB'
                rs.image_settings.file_format = 'JPEG'
            
            # This is slightly tricky. To find out whether the alpha channel of this 
            # image is in use, we have to traverse all referencing textures and check
            # the state of their 'Use Alpha' flag. There's got to be a better way.
            
            img['outfn'] = os.path.splitext(os.path.split(img['filename'])[1])[0] + ext
            out_filename = self.directory + img['outfn']
            
            print('Texture("%s", %dx%d) -> ("%s", %dx%d)' %  (img['filename'], img['width'], img['height'], out_filename, ow, oh))
            
            imgc = img['image'].copy()
            imgc.scale(ow, oh)
            
            if self.merge_alpha and img['alpha']:
                print('Found diffuse texture with alpha, merging the a channel.')
                alphac = img['alpha'].copy()
                alphac.scale(ow, oh)
                cp = list(imgc.pixels)
                ap = list(alphac.pixels)
                ofs = 0
                
                for y in range(imgc.size[1]):
                    for x in range(imgc.size[0]):
                        cp[ofs+3] = ap[ofs]
                        ofs += 4
                
                imgc.pixels = cp
            
            rs.filepath = out_filename
            imgc.save_render(out_filename, self.render_settings)
            bpy.data.images.remove(imgc)
            
    def clean_up(self):
        bpy.data.scenes.remove(self.render_settings)
        bpy.data.materials.remove(self.default_mat)                        

class EngiMaterialCache:
    def __init__(self):
        self.materials = {}
        
    def add(self, ctx, mat, mesh):
        if mat.name not in self.materials:
            self.materials[mat.name] = EngiMaterial(ctx, mat, mesh)
        
        return self.materials[mat.name]
    
    def serialise(self):
        json = '\t"materials": {\n'
        delim = ''
        
        for m in self.materials:
            json += '%s%s' % (delim, self.materials[m].serialise())
            delim = ',\n'
        
        json += '\n\t},\n'
        
        return json

def ts_invalid(ts):
    return not ts or not ts.texture or ts.texture.type != 'IMAGE' or not ts.texture.image

class EngiMaterial:
    def __init__(self, ctx, mat, mesh):
        self.ctx = ctx
        self.material = mat
        self.mesh = mesh
    
        alpha = None
        d_name = None
        idx = -1
        
        for ts in self.material.texture_slots:
            idx = idx + 1
            
            if ts_invalid(ts) or not mat.use_textures[idx]:
                continue
            
            if ts.use_map_alpha:
                alpha = ts.texture.image
                print('Found alpha map = ' + alpha.name)
            elif ts.use_map_color_diffuse:
                d_name = ts.texture.image.name
                print('Found diffuse map = ' + d_name)
                
            if ts.texture.image.name in self.ctx.unique_textures:
                self.ctx.unique_textures[ts.texture.image.name]['used'] = True

        if alpha and d_name:
            print('Enabling alpha merge for material: ' + self.material.name)
            self.ctx.unique_textures[alpha.name]['used'] = False
            self.ctx.unique_textures[d_name]['alpha'] =  alpha
    
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
                print('Error: Failed to find unique texture by name: [%s]\n\nThe full collection contains:' % img.name)
                
                for name in ctx.unique_textures:
                        print('[%s]' % name)
            
            return ''
	        
        for ts in self.material.texture_slots:
            if ts_invalid(ts):
                continue
            
            # We cannot support using a single map for multiple things, although the
            # same texture image may be used for different mapping, provided a texture
            # slot per mapping is used.
            if ts.use_map_color_diffuse:
                if ts.texture.image.name in self.ctx.unique_textures and self.ctx.unique_textures[ts.texture.image.name]['achannel']:
                    json += ',\n\t\t\t\t"depth_write": false,\n\t\t\t\t"depth_test": false,\n\t\t\t\t"alpha_clip": true'
                
                json += format_map('diffuse_color', ts.diffuse_color_factor, self.ctx, ts)
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

class EngiBatch:
    def __init__(self, ctx, m_name, index, mat, mesh, polygons, export_normals):
        self.ctx = ctx
        self.material = ctx.material_cache.add(ctx, mat, mesh)
        self.verts = []
        self.norms = []
        self.uvs = [[], [], [], []]
        self.bb_lo = [9999999.0, 9999999.0, 9999999.0]
        self.bb_hi = [-9999999.0, -9999999.0, -9999999.0]
        self.index = index
        self.m_name = m_name
        
        for poly in polygons:
            for v in [mesh.vertices[v] for v in list(poly.vertices)]:
                self.verts.append(v)
                
                self.bb_lo[0] = v.co[0] if v.co[0] < self.bb_lo[0] else self.bb_lo[0]
                self.bb_lo[1] = v.co[1] if v.co[1] < self.bb_lo[1] else self.bb_lo[1]
                self.bb_lo[2] = v.co[2] if v.co[2] < self.bb_lo[2] else self.bb_lo[2]
                
                self.bb_hi[0] = v.co[0] if v.co[0] > self.bb_hi[0] else self.bb_hi[0]
                self.bb_hi[1] = v.co[1] if v.co[1] > self.bb_hi[1] else self.bb_hi[1]
                self.bb_hi[2] = v.co[2] if v.co[2] > self.bb_hi[2] else self.bb_hi[2]
                
                if export_normals:
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
                uv = flatten(map(lambda v: [math.fmod(v.uv[0], 1.0), math.fmod(v.uv[1], 1.0)], uv))
                self.uvs[idx] = uv
            
    def serialise(self, export_normals):
        json = '\t\t\t\t{\n'
        json += '\t\t\t\t\t"material": "%s"' % self.material.material.name
        
        ident = ',\n\t\t\t\t\t'
        json += '%s"vertices": "%s"' % (ident, stream_to_image(self.ctx, '%s_%s_v%d' % (self.ctx.file_base_name, self.m_name, self.index), struct.pack('<' + ('f' * len(self.verts)), *self.verts), self.verts))
        
        if export_normals:
            json += '%s"normals": "%s"' % (ident, stream_to_image(self.ctx, '%s_%s_n%d' % (self.ctx.file_base_name, self.m_name, self.index), struct.pack('<' + ('f' * len(self.norms)), *self.norms), self.norms))
        
        for idx in range(4):
            uv = self.uvs[idx]
            
            if len(uv) > 0:
                json += '%s"uv%d": "%s"' % (ident, idx, stream_to_image(self.ctx, '%s_%s_t%d%d' % (self.ctx.file_base_name, self.m_name, idx, self.index), struct.pack('<' + ('f' * len(uv)), *uv), uv))
            
        json += '\n\t\t\t\t}'
        return json

class EngiMesh:
    def __init__(self, ctx, obj, mesh, export_normals):
        self.ctx = ctx
        self.obj = obj
        self.mesh = mesh
        self.batches = []
        self.bb_lo = [9999999.0, 9999999.0, 9999999.0]
        self.bb_hi = [-9999999.0, -9999999.0, -9999999.0]
        self.v_count = 0
        self.export_normals = export_normals
        self.name = sanitize_name(self.obj.name)
        
        n_batches = []
        materials = {}
        mats = mesh.materials
        
        if mats.keys(): # Do we have any materials at all?
            """Create a unique set of referenced materials 
               so we can pre-split the mesh into batches by 
               material"""
            for poly in mesh.polygons:
                if mats[poly.material_index] not in materials:
                    materials[poly.material_index] = mats[poly.material_index]
            
            idx = 0
            
            for i in materials:
                polys = []
                
                for poly in mesh.polygons:
                    if poly.material_index == i:
                        polys.append(poly)
                
                n_batches.append(EngiBatch(ctx, self.name, idx, materials[i], mesh, polys, export_normals))
                idx += 1
        else:
            # Create one batch with a default material
            n_batches.append(EngiBatch(ctx, self.name, 0, ctx.default_mat, mesh, mesh.polygons, export_normals))
        
        for b in n_batches:
            if len(b.verts) > 0:
                self.bb_lo[0] = b.bb_lo[0] if b.bb_lo[0] < self.bb_lo[0] else self.bb_lo[0]
                self.bb_lo[1] = b.bb_lo[1] if b.bb_lo[1] < self.bb_lo[1] else self.bb_lo[1]
                self.bb_lo[2] = b.bb_lo[2] if b.bb_lo[2] < self.bb_lo[2] else self.bb_lo[2]
                
                self.bb_hi[0] = b.bb_hi[0] if b.bb_hi[0] > self.bb_hi[0] else self.bb_hi[0]
                self.bb_hi[1] = b.bb_hi[1] if b.bb_hi[1] > self.bb_hi[1] else self.bb_hi[1]
                self.bb_hi[2] = b.bb_hi[2] if b.bb_hi[2] > self.bb_hi[2] else self.bb_hi[2]
                
                self.v_count += len(b.verts)
                self.batches.append(b)
    
    def serialise(self):
        json = '\t\t"%s": {\n' % self.name
        json += '\t\t\t"batches": [\n'
        
        b_delim = ''
        
        for batch in self.batches:
                json += '%s%s' % (b_delim, batch.serialise(self.export_normals))
                b_delim = ',\n'
        
        json += '\n\t\t\t]\n\t\t}'
        return json
        
class JSONExporter(bpy.types.Operator, ExportHelper):
    bl_idname = 'export.json'
    bl_label = 'Export Engi (.json)'
    bl_options = {'PRESET'}
    filename_ext = ".json"
    
    filter_glob = StringProperty(default="*.json", options={'HIDDEN'})
    export_cameras = BoolProperty(name="Export cameras", default=False)
    export_normals = BoolProperty(name="Export normals", default=True)
    smooth_normals = BoolProperty(name="Smooth normals", default=True)
    merge_alpha = BoolProperty(name="Merge alpha into diffuse", default=False)
    
    #filepath = StringProperty()
    filename = StringProperty()
    directory = StringProperty()
    
    # Black Magic...
    check_extension = True
    
    def draw(self, context):
        layout = self.layout
        
        box = layout.box()
        box.label('Options:')
        box.prop(self, 'export_cameras')
        box.prop(self, 'export_normals')
        box.prop(self, 'smooth_normals')
        box.prop(self, 'merge_alpha')
    
    def execute(self, context):
        scene = bpy.context.scene # Export the active scene
        ctx = EngiContext(scene, self.directory)
        
        world_amb = Color((0.0, 0.0, 0.0))
        filename = os.path.splitext(self.filename)[0]
        ctx.file_base_name = filename
        ctx.base_path = self.directory
        
        filename = filename + '.json'
        
        print('Target path = %s' % (self.directory + filename)) 
        bb_lo = None
        bb_hi = None
        
        if scene.objects.active:
            try:
                bpy.ops.object.mode_set(mode = 'OBJECT')
                bpy.ops.object.select_all(action = 'DESELECT')
            except:
                pass
        
        ctx.merge_alpha = self.merge_alpha
        
        mjson = ''
        
        json = ''
        json += '{\n'
        json += '\t"id": "%s",\n' % sanitize_name(filename) 
        
        for i in scene.objects:
            i.select = False # deselect all objects
            
            if self.export_cameras:
                cams = []
                
                for obj in bpy.data.objects:
                    if obj.type == 'CAMERA':
                        cams.append(obj)
                        
                if len(cams) > 0:
                    mjson = '\t"cameras": {'
                    cdelim = ''
                    
                    for cam in cams:
                        mjson += '%s\n\t\t"%s" {' % (cdelim, cam.name)
                        mjson += ',\n\t\t\t"fov": %s' % cnr(math.degrees(cam.data.angle))
                        mjson += ',\n\t\t\t"near_clip": %s' % cnr(cam.data.clip_start)
                        mjson += ',\n\t\t\t"far_clip": %s' % cnr(cam.data.clip_end)
                        mjson += ',\n\t\t\t"position": [%s, %s, %s]' % (cnr(cam.location.x), cnr(cam.location.y), cnr(cam.location.z))
                        mjson += ',\n\t\t\t"rotation": [%s, %s, %s]' % (cnr(cam.rotation_euler.x), cnr(cam.rotation_euler.y), cnr(cam.rotation_euler.z))
                        mjson += '\n\t\t}'
                        cdelim = ','
                    
                    mjson += '\n\t},\n'
                        
        mjson += '\t"meshes": {\n'
        delim = ''
        
        for obj in bpy.data.objects:
            dbg('Found object ' + obj.name + ' of type ' + obj.type)
            
            if obj.type == 'MESH':
                # Copy the object temporarily, so we can maniulate the copy prior
                # to export, without altering the original scene.
                objc = obj.copy()
                scene.objects.link(objc)
                scene.update()
                
                objc.select = True
                scene.objects.active = objc
                
                try:
                    bpy.ops.object.mode_set(mode='EDIT')
                    bpy.ops.mesh.select_all(action='SELECT')
                    bpy.ops.object.mode_set(mode='EDIT')
                    bpy.ops.mesh.quads_convert_to_tris()
                except:
                    continue
                
                if self.smooth_normals:
                    bpy.ops.mesh.faces_shade_smooth()
                
                scene.update()
                
                bpy.ops.object.mode_set(mode='OBJECT')
                mesh = objc.to_mesh(scene, True, 'PREVIEW') #write data object
                scene.update()
                
                # Transform from local to world space.
                mesh.transform(obj.matrix_world)
                mesh.update()
                
                cmesh = EngiMesh(ctx, obj, mesh, self.export_normals)

                m_name = mesh.name
                
                # Remove the temporary objects
                scene.objects.unlink(objc)
                bpy.data.objects.remove(objc)
                
                scene.update()
                
                if len(cmesh.batches) < 1 or cmesh.v_count < 1:
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

                print(bb_lo)
                print(bb_hi)
                mjson += '%s%s' % (delim, cmesh.serialise())
                delim = ',\n'
                
                bpy.data.meshes.remove(bpy.data.meshes[m_name])
                
        mjson += '\n\t},'
        
        if bb_lo and bb_hi:
            mjson += '\n\t"bounding_box": { "lo": [' + cnr(bb_lo[0]) + ', ' + cnr(bb_lo[1]) + ', ' + cnr(bb_lo[2]) + '], "hi": [' + cnr(bb_hi[0]) + ', ' + cnr(bb_hi[1]) + ', ' + cnr(bb_hi[2]) + '] }\n';
        else:
            mjson += '\n\t"bounding_box": { "lo": [-0.5, -0.5, -0.5], "hi": [0.5, 0.5, 0.5] }\n';
            
        # Convert textures
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
    self.layout.operator(JSONExporter.bl_idname, text="Engi (.json)")


def register():
    bpy.utils.register_class(JSONExporter)
    bpy.types.INFO_MT_file_export.append(menu_func)


def unregister():
    bpy.utils.unregister_class(JSONExporter)
    bpy.types.INFO_MT_file_export.remove(menu_func)


if __name__ == '__main__':
    register()
