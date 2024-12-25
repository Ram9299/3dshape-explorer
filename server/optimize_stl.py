import numpy as np
from stl import mesh
import json
import sys
import os

def optimize_stl(input_file, output_file, simplification_ratio=0.5):
    """
    Optimize STL file by:
    1. Removing duplicate vertices
    2. Simplifying mesh
    3. Converting to a more efficient JSON format
    4. Adding level of detail support
    """
    # Read the STL file
    mesh_data = mesh.Mesh.from_file(input_file)
    
    # Convert to vertices and faces format
    vertices = mesh_data.vectors.reshape((-1, 3))
    faces = np.arange(len(vertices)).reshape((-1, 3))
    
    # Remove duplicate vertices
    unique_vertices, inverse = np.unique(vertices, axis=0, return_inverse=True)
    faces = inverse[faces]
    
    # Calculate vertex normals
    vertex_normals = np.zeros_like(unique_vertices)
    for face in faces:
        v1, v2, v3 = unique_vertices[face]
        normal = np.cross(v2 - v1, v3 - v1)
        normal = normal / np.linalg.norm(normal)
        vertex_normals[face] += normal
    
    # Normalize vertex normals
    norms = np.linalg.norm(vertex_normals, axis=1)
    norms[norms == 0] = 1
    vertex_normals = vertex_normals / norms[:, np.newaxis]
    
    # Create multiple LOD levels
    lod_levels = [1.0, 0.5, 0.25]  # 100%, 50%, 25% detail
    output_data = {
        "format": "optimized-mesh",
        "version": 1,
        "levels": []
    }
    
    for lod in lod_levels:
        target_faces = int(len(faces) * lod)
        # In a real implementation, you would use proper mesh decimation here
        # This is a simplified version that just takes a subset
        if lod < 1.0:
            subset_faces = faces[:target_faces]
            used_vertices = np.unique(subset_faces)
            vertex_map = {old: new for new, old in enumerate(used_vertices)}
            new_faces = np.array([[vertex_map[idx] for idx in face] for face in subset_faces])
            new_vertices = unique_vertices[used_vertices]
            new_normals = vertex_normals[used_vertices]
        else:
            new_faces = faces
            new_vertices = unique_vertices
            new_normals = vertex_normals
            
        level_data = {
            "vertices": new_vertices.tolist(),
            "faces": new_faces.tolist(),
            "normals": new_normals.tolist(),
            "detail": lod
        }
        output_data["levels"].append(level_data)
    
    # Save optimized format
    with open(output_file, 'w') as f:
        json.dump(output_data, f)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python optimize_stl.py input.stl output.json")
        sys.exit(1)
    
    optimize_stl(sys.argv[1], sys.argv[2])