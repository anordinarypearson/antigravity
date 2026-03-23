import math

def generate_wavy_path(cx, cy, r_inner, r_outer, points, is_hollow=False):
    path = []
    
    # generate outer
    for i in range(points * 2):
        angle = (i * math.pi) / points
        r = r_outer if i % 2 == 0 else r_inner
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        
        # we need tangent control points for smooth curves
        if i == 0:
            path.append(f"M {x:.2f} {y:.2f}")
            # well bezier curves are better generated with standard tools
    pass

def generate_wavy_curve(cx, cy, r_base, wave_amp, points):
    # R(theta) = r_base + wave_amp * cos(points * theta)
    # create path
    N = 200
    path = []
    for i in range(N+1):
        theta = (i / N) * 2 * math.pi
        r = r_base + wave_amp * math.cos(points * theta)
        x = cx + r * math.cos(theta)
        y = cy + r * math.sin(theta)
        if i == 0:
            path.append(f"M {x:.2f} {y:.2f}")
        else:
            path.append(f"L {x:.2f} {y:.2f}")
    path.append("Z")
    return " ".join(path)

print(generate_wavy_curve(50, 50, 43, 6, 10))
