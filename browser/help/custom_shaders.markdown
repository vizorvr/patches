<link href="style.css" rel="stylesheet"></link>

#<span style="font-family: 'greyscale_basic_regular', sans-serif;">E N G I</span>

##Authoring custom shaders

###Introduction:
The 'From mesh shader custom' plugin is provided for those who wish to write arbitrary shaders. Some
knowledge of how Engi's renderer composes shaders automatically to integrate with the material and
lighting system is required to effectively do so, and will be summarized in the sections below. To
compose an automatically generated default shader the following procedure is used:

1. Create a new 'from mesh custom shader' plugin instance and connect it to a mesh renderer. If left
   unconnected, the plugin will not be updated.
2. Connect a mesh to the shader and optionally an external material to overload the mesh defaults.
3. Connect the mesh to the renderer and hit play to update the graph and then stop playback again.

Since no custom code has been added, the shader plugin will populate itself with a default shader
matching the supplied mesh and / or material. You can now open either the vertex or pixel shader editor
and revise the default shader in any way desired. Once generated, the shader code will not be overwritten,
even if the mesh or material changes. To force automatic recompilation of the shader, clear both
vertex and pixel shader and play the graph to update the plugin state.

###Automatically declared vertex attributes

| Name   | Type | Will be generated if      |
| ------ | ---- | ------------------------- |
| v_pos  | vec3 | Always                    |
| v_col  | vec4 | Mesh has per-vertex color |
| v_norm | vec3 | Mesh has normals          |
| v_uv0  | vec2 | Mesh has UV map           |
| v_uv1  | vec2 | Reserved for future use   |
| v_uv2  | vec2 | Reserved for future use   |
| v_uv3  | vec2 | Reserved for future use   |

###Automatically declared vertex shader uniforms

| Name   | Type | Comment            | Will be generated if      |
| ------ | ---- | ------------------ | ------------------------- |
| d_col  | vec4 | Diffuse color      | Always                    |
| m_mat  | mat4 | Model matrix       | Always                    |
| v_mat  | mat4 | View matrix        | Always                    |
| p_mat  | mat4 | Projection matrix  | Always                    |
| n_mat  | mat4 | Normal matrix      | Mesh has normals          |

###Automatically declared pixel shader uniforms

| Name      | Type      | Comment            | Will be generated if                              |
| --------- | --------- | ------------------ | ------------------------------------------------- |
| a_col     | vec4      | Ambient color      | Always                                            |
| s_col     | vec4      | Specular color     | Mesh has normals and material at least one light  |
| v_mat     | mat4      | View matrix        | Always                                            |
| shinyness | float     | Specular intensity | Mesh has normals and material at least one light  |
| d_tex     | sampler2D | Diffuse texture    | Mesh has UV map and material has diffuse texture  |
| s_tex     | sampler2D | Specular texture   | Mesh has UV map and material has specular texture |
| n_tex     | sampler2D | Normal map         | Mesh has UV map and material has normal map       |
| e_tex     | sampler2D | Emissive texture   | Mesh has UV map and material has emissive texture |

###Automatically declared pixel shader uniforms for each light

Light related uniforms will be created only if the mesh has normals. In the following
table, 'X' denotes the light index (0-7) as defined by the material chain.

| Name       | Type  | Comment            | Will be generated if      |
| ---------- | ----- | ------------------ | ------------------------- |
| lX_pos     | vec3  | Light position     | Always                    |
| lX\_d\_col | vec4  | Diffuse color      | Always                    |
| lX\_s\_col | vec4  | Specular color     | Always                    |
| lX_power   | float | Light intensity    | Always                    |
| lX_dir     | vec3  | Light direction    | Light is directional      |
