import json
import os

def generate_layout():
    # 1. Define standard plot sizes and area mappings from the layout table
    # We will map plot numbers to their (size, area_mt, area_ft)
    meta_table = {}
    
    # Plot 1
    meta_table["1"] = ("1/2X(11.65+10.28)X18.28", "200.44 SQMT", "2158 SQFT")
    # Plots 2 to 7
    for num in range(2, 8):
        meta_table[str(num)] = ("9.14X18.28", "167.08 SQMT", "1800 SQFT")
    # Plot 8
    meta_table["8"] = ("1/2X(14.74+15.88)X15.24", "233.32 SQMT", "2408 SQFT")
    # Plot 9
    meta_table["9"] = ("1/2X(15.88+16.56)X9.14", "148.25 SQMT", "1596 SQFT")
    # Plot 10
    meta_table["10"] = ("1/2X(16.56+17.25)X9.14", "154.51 SQMT", "1580 SQFT")
    # Plots 11 to 16
    for num in range(11, 17):
        meta_table[str(num)] = ("9.14X15.24", "139.29 SQMT", "1500 SQFT")
    # Plot 17
    meta_table["17"] = ("1/2X(10.28+9.14)X15.24", "147.98 SQMT", "1593 SQFT")
    # Plot 18
    meta_table["18"] = ("1/2X(14.97+15.87)X12.00", "185.04 SQMT", "1909 SQFT")
    # Plots 19 to 36
    for num in range(19, 37):
        meta_table[str(num)] = ("8.00X12.00", "96.00 SQMT", "1033 SQFT")
    # Plot 37
    meta_table["37"] = ("1/2X(14.29+13.40)X12.00", "166.14 SQMT", "1705 SQFT")
    # Plot 38
    meta_table["38"] = ("1/2X(13.40+12.50)X12.00", "155.40 SQMT", "1590 SQFT")
    # Plots 39 to 47
    for num in range(39, 48):
        meta_table[str(num)] = ("8.00X12.00", "96.00 SQMT", "1033 SQFT")
    # Plot 48
    meta_table["48"] = ("1/2X(9.00+10.32)X12.00", "115.92 SQMT", "1248 SQFT")
    # Plots 49 to 63
    for num in range(49, 64):
        meta_table[str(num)] = ("9.00X12.00", "108.00 SQMT", "1163 SQFT")
    # Plot 64
    meta_table["64"] = ("1/2X(13.66+12.76)X12.00", "158.52 SQMT", "1623 SQFT")
    # Plot 65
    meta_table["65"] = ("1/2X(12.76+11.64)X15.00", "183.00 SQMT", "1887 SQFT")
    # Plots 66 to 80
    for num in range(66, 81):
        meta_table[str(num)] = ("9.00X15.00", "135.00 SQMT", "1453 SQFT")
    # Plot 81
    meta_table["81"] = ("1/2X(10.32+11.97)X15.00", "167.18 SQMT", "1800 SQFT")

    # 2. Build map coordinates layout
    plots_list = []
    
    # Helper to round coordinates
    def r_coords(poly):
        return [[round(pt[0], 2), round(pt[1], 2)] for pt in poly]

    # --- LEFT BLOCK (Columns 1 & 2) ---
    # Column 1 (plots 81 to 65 descending top-to-bottom)
    # Column 2 (plots 48 to 64 ascending top-to-bottom)
    # y-range: 5 to 78, x-range Col 1: 5 to 13, Col 2: 13 to 21
    num_rows_left = 17
    row_height_left = (78.0 - 5.0) / num_rows_left
    
    for r in range(num_rows_left):
        y1 = 5.0 + r * row_height_left
        y2 = y1 + row_height_left
        
        # Column 1 (left): plots 81 to 65
        p1_num = str(81 - r)
        p1_size, p1_area_mt, p1_area_ft = meta_table.get(p1_num, ("N/A", "N/A", "N/A"))
        plots_list.append({
            "id": f"plot_{p1_num}",
            "plot_number": p1_num,
            "size": p1_size,
            "area": f"{p1_area_mt} ({p1_area_ft})",
            "polygon": r_coords([[5.0, y1], [13.0, y1], [13.0, y2], [5.0, y2]]),
            "status": "available",
            "price": "Market Rate",
            "notes": "East facing residential plot."
        })
        
        # Column 2 (right): plots 48 to 64
        p2_num = str(48 + r)
        p2_size, p2_area_mt, p2_area_ft = meta_table.get(p2_num, ("N/A", "N/A", "N/A"))
        plots_list.append({
            "id": f"plot_{p2_num}",
            "plot_number": p2_num,
            "size": p2_size,
            "area": f"{p2_area_mt} ({p2_area_ft})",
            "polygon": r_coords([[13.0, y1], [21.0, y1], [21.0, y2], [13.0, y2]]),
            "status": "available",
            "price": "Market Rate",
            "notes": "West facing residential plot."
        })

    # --- BOTTOM BLOCK (Rows 1 & 2) ---
    # Row 1 (bottom): plots 8 to 1 (left to right)
    # y-range: 91 to 96, x-range: 5 to 45
    # Row 2 (top of bottom block): plots 9 to 17 (left to right)
    # y-range: 85 to 91, x-range: 5 to 50
    
    # Row 2 (plots 9 to 17)
    num_cols_r2 = 9
    col_width_r2 = (50.0 - 5.0) / num_cols_r2
    for c in range(num_cols_r2):
        x1 = 5.0 + c * col_width_r2
        x2 = x1 + col_width_r2
        y1, y2 = 85.0, 90.0
        
        p_num = str(9 + c)
        p_size, p_area_mt, p_area_ft = meta_table.get(p_num, ("N/A", "N/A", "N/A"))
        plots_list.append({
            "id": f"plot_{p_num}",
            "plot_number": p_num,
            "size": p_size,
            "area": f"{p_area_mt} ({p_area_ft})",
            "polygon": r_coords([[x1, y1], [x2, y1], [x2, y2], [x1, y2]]),
            "status": "available",
            "price": "Market Rate",
            "notes": "Road facing premium plot."
        })

    # Row 1 (plots 8 to 1)
    num_cols_r1 = 8
    col_width_r1 = (45.0 - 5.0) / num_cols_r1
    for c in range(num_cols_r1):
        x1 = 5.0 + c * col_width_r1
        x2 = x1 + col_width_r1
        y1, y2 = 90.0, 95.0
        
        p_num = str(8 - c)
        p_size, p_area_mt, p_area_ft = meta_table.get(p_num, ("N/A", "N/A", "N/A"))
        plots_list.append({
            "id": f"plot_{p_num}",
            "plot_number": p_num,
            "size": p_size,
            "area": f"{p_area_mt} ({p_area_ft})",
            "polygon": r_coords([[x1, y1], [x2, y1], [x2, y2], [x1, y2]]),
            "status": "available",
            "price": "Market Rate",
            "notes": "Road facing premium corner plot."
        })

    # --- MIDDLE BLOCK (Columns 1, 2, 3) ---
    # Column 1 (plots 47 to 38 top-to-bottom) -> x-range: 25 to 33, y-range: 35 to 80
    # Column 2 (plots 28 to 37 top-to-bottom) -> x-range: 37 to 45, y-range: 35 to 80
    # Column 3 (plots 27 to 18 top-to-bottom) -> x-range: 45 to 53, y-range: 35 to 80
    # Open Space: x-range: 25 to 40, y-range: 5 to 20
    # Amenity Space: x-range: 25 to 40, y-range: 20 to 35
    num_rows_middle = 10
    row_height_middle = (78.0 - 35.0) / num_rows_middle
    
    # Open Space & Amenity Space (as special entries in the plots database)
    plots_list.append({
        "id": "plot_open_space",
        "plot_number": "Open Space",
        "size": "N/A",
        "area": "1600.20 SQMT",
        "polygon": r_coords([[25.0, 5.0], [42.0, 5.0], [42.0, 20.0], [25.0, 20.0]]),
        "status": "reserved",
        "price": "Common Area",
        "notes": "Open space / children play park."
    })
    plots_list.append({
        "id": "plot_amenity_space",
        "plot_number": "Amenity Space",
        "size": "N/A",
        "area": "1600.20 SQMT",
        "polygon": r_coords([[25.0, 20.0], [42.0, 20.0], [42.0, 35.0], [25.0, 35.0]]),
        "status": "reserved",
        "price": "Common Area",
        "notes": "Amenity space."
    })
    
    for r in range(num_rows_middle):
        y1 = 35.0 + r * row_height_middle
        y2 = y1 + row_height_middle
        
        # Column 1 (plots 47 to 38)
        p1_num = str(47 - r)
        p1_size, p1_area_mt, p1_area_ft = meta_table.get(p1_num, ("N/A", "N/A", "N/A"))
        plots_list.append({
            "id": f"plot_{p1_num}",
            "plot_number": p1_num,
            "size": p1_size,
            "area": f"{p1_area_mt} ({p1_area_ft})",
            "polygon": r_coords([[25.0, y1], [33.0, y1], [33.0, y2], [25.0, y2]]),
            "status": "available",
            "price": "Market Rate",
            "notes": "Premium inner sector plot."
        })
        
        # Column 2 (plots 28 to 37)
        p2_num = str(28 + r)
        p2_size, p2_area_mt, p2_area_ft = meta_table.get(p2_num, ("N/A", "N/A", "N/A"))
        plots_list.append({
            "id": f"plot_{p2_num}",
            "plot_number": p2_num,
            "size": p2_size,
            "area": f"{p2_area_mt} ({p2_area_ft})",
            "polygon": r_coords([[37.0, y1], [45.0, y1], [45.0, y2], [37.0, y2]]),
            "status": "available",
            "price": "Market Rate",
            "notes": "Premium inner sector plot."
        })
        
        # Column 3 (plots 27 to 18)
        p3_num = str(27 - r)
        p3_size, p3_area_mt, p3_area_ft = meta_table.get(p3_num, ("N/A", "N/A", "N/A"))
        plots_list.append({
            "id": f"plot_{p3_num}",
            "plot_number": p3_num,
            "size": p3_size,
            "area": f"{p3_area_mt} ({p3_area_ft})",
            "polygon": r_coords([[45.0, y1], [53.0, y1], [53.0, y2], [45.0, y2]]),
            "status": "available",
            "price": "Market Rate",
            "notes": "Outer border sector plot."
        })

    # 3. Define Vector decorations (roads, background text, etc.)
    decorations = [
        # Roads (coordinates mapping layout paths)
        {
            "type": "road",
            "label": "12.00 Mt. Wide Road",
            "polygon": r_coords([[0.0, 0.0], [5.0, 0.0], [5.0, 95.0], [0.0, 95.0]])
        },
        {
            "type": "road",
            "label": "9.00 Mt. Wide Road",
            "polygon": r_coords([[21.0, 5.0], [25.0, 5.0], [25.0, 78.0], [21.0, 78.0]])
        },
        {
            "type": "road",
            "label": "9.00 Mt. Wide Road",
            "polygon": r_coords([[33.0, 35.0], [37.0, 35.0], [37.0, 78.0], [33.0, 78.0]])
        },
        {
            "type": "road",
            "label": "9.00 Mt. Wide Road",
            "polygon": r_coords([[5.0, 78.0], [100.0, 78.0], [100.0, 85.0], [5.0, 85.0]])
        },
        {
            "type": "road",
            "label": "15.00 Mt. Wide Road",
            "polygon": r_coords([[0.0, 95.0], [100.0, 95.0], [100.0, 100.0], [0.0, 100.0]])
        },
        {
            "type": "road",
            "label": "80'00\" Chimur Neri Highway Road",
            "polygon": r_coords([[53.0, 70.0], [100.0, 70.0], [100.0, 78.0], [53.0, 78.0]])
        },
        # General site surroundings
        {
            "type": "site_boundary",
            "label": "Shasikiya Tantraniketan",
            "polygon": r_coords([[56.0, 10.0], [70.0, 10.0], [70.0, 20.0], [56.0, 20.0]])
        },
        {
            "type": "site_boundary",
            "label": "ST Claret CBSE School",
            "polygon": r_coords([[73.0, 10.0], [87.0, 10.0], [87.0, 20.0], [73.0, 20.0]])
        }
    ]

    # Save to JSON database
    map_data = {
        "plots": plots_list,
        "decorations": decorations
    }
    
    os.makedirs("/Users/meet/Desktop/proj 1.1/static", exist_ok=True)
    out_path = "/Users/meet/Desktop/proj 1.1/static/map_data.json"
    with open(out_path, "w") as f:
        json.dump(map_data, f, indent=2)
    
    print(f"Generated clean interactive database containing {len(plots_list)} plots at {out_path}")

if __name__ == "__main__":
    generate_layout()
