import math
import numpy as np
import matplotlib.pyplot as plt
from shapely.geometry import Polygon
import matplotlib.patches as patches
from shapely.geometry import LineString

def right_auto_cropper(points, num_points_per_edge, image_width, image_height):
    # Function to create a detailed polygon with more points
    def generate_polygon_with_details(points, num_points_per_edge):
        # Define the polygon using shapely
        poly = Polygon(points)

        # Extract edges
        edges = list(poly.exterior.coords)

        # Create a list to store detailed points
        detailed_points = []

        # Generate points on each edge
        for i in range(len(edges) - 1):
            start_point = np.array(edges[i])
            end_point = np.array(edges[i + 1])

            # Generate intermediate points
            for t in np.linspace(0, 1, num_points_per_edge):
                intermediate_point = start_point + t * (end_point - start_point)
                detailed_points.append(intermediate_point)

        # Close the polygon by adding the last point
        detailed_points.append(np.array(edges[-1]))

        return np.array(detailed_points)

    #Find point with the smallest y-value, but within an interval of the x-values
    def find_smallest_y_value_between_interval(points, interval_0, interval_1):

        # Find the point closest to the target_y with x-coordinate greater than half_width
        min_point = min([point for point in points if point[0] > interval_0 and point[0] < interval_1],  # Filter points where x lies in the interval between interval_0 and interval_1
                            key=lambda point: point[1])  # Find the point closest with the smallest y-value

        return min_point

    def find_most_right_and_left(points):
        # Find the point with the maximum x-coordinate (most right)
        most_right = max(points, key=lambda point: point[0])

        # Find the point with the minimum x-coordinate (most left)
        most_left = min(points, key=lambda point: point[0])

        return most_right, most_left

    # Function to calculate the distance between y_min and y_max
    def calculate_y_distance(points):
        # Extract the y-coordinates (second element of each pair)
        y_coordinates = [point[1] for point in points]

        # Find the minimum and maximum y-coordinates
        y_min = min(y_coordinates)
        y_max = max(y_coordinates)

        # Calculate the distance between y_min and y_max
        distance = y_max - y_min

        return y_min, y_max, distance

    # Function to calculate the most right point closest to 1/3 of the y-distance
    def find_right_point_closest_to_y_third(points, y_min, max_distance, image_width):
        # Calculate the target y-value, which is y_min + 1/3 of the provided y_max_distance
        target_y = y_min + (1 / 2) * max_distance

        half_width = image_width/2
        # Find the point closest to the target_y with x-coordinate greater than half_width
        closest_point = min([point for point in points if point[0] > half_width],  # Filter points where x > half_width
            key=lambda point: abs(point[1] - target_y)  # Find the point closest to target_y
        )

        # Find the point with the largest x-coordinate (most right) closest to the target_y
        right_point = max([point for point in points if abs(point[1] - closest_point[1]) < 1e-6 and point[0] > half_width],key=lambda point: point[0])

        return right_point

    x_boundary = image_width/50
    y_boundary = image_height/50

    detailed_points = generate_polygon_with_details(points, num_points_per_edge)

    # Convert to numpy array for easy plotting
    detailed_points = np.array(detailed_points)

    right_top = find_smallest_y_value_between_interval(detailed_points, image_width/3, image_width)

    print(f"The most top-right point is: {right_top}, with an y-value of: {right_top[1]}")

    # Call the function
    most_right_point, most_left_point = find_most_right_and_left(detailed_points)

    print(f"Most right point: {most_right_point}")
    print(f"Most left point: {most_left_point}")

    concatenated_points = np.vstack((most_right_point, right_top))

    # Call the function and print the result
    y_min_back_side, y_max_back_side, distance_back_side = calculate_y_distance(concatenated_points)
    print(f"The distance between y_min and y_max on the back sideline is: {distance_back_side}")

    # Call the function and print the result
    right_x_point = find_right_point_closest_to_y_third(detailed_points, y_min_back_side, distance_back_side, image_width)
    print(f"The most right point closest to 1/3 of the y-distance is: {right_x_point}")

    x0 = 0
    x2 = right_x_point[0]
    x1 = (x2 - x0) * 0.6 + x0

    right_top_2 = find_smallest_y_value_between_interval(detailed_points, x0, x1)

    print(f"The most top-right point in the specific interval {x0, x1} is: {right_top_2}, with an y-value of: {right_top_2[1]}")

    # Call the function and print the result
    _, y_max, distance = calculate_y_distance(detailed_points)

    y0_A = max(right_top[1] - (2*y_boundary), 0)
    x3 = min(image_width, most_right_point[0] + x_boundary)

    y0_B  = max(right_top_2[1] - (2*y_boundary), 0)
    y0_C  = max(0, right_x_point[1] - y_boundary)
    y1_A = right_x_point[1] + (5 * y_boundary)
    y1_B = y0_B + distance / 2
    y1_C = min(y_max + y_boundary, image_height)

    # Plot the results with switched axes
    plt.figure(figsize=(16, 9))  # Adjust figure size to roughly match 1920x1080 ratio
    plt.plot(points[:, 0], points[:, 1], 'ro', label='Original Points')
    plt.plot(detailed_points[:, 0], detailed_points[:, 1], 'b-', label='Detailed Polygon', alpha=0.1)
    plt.title('Polygon with Detailed Edges')
    plt.xlabel('X')  # X-axis is now the original y-axis
    plt.ylabel('Y')  # Y-axis is now the original x-axis
    plt.xlim([0, image_width])
    plt.ylim([image_height, 0])
    plt.legend()
    plt.grid(True)

    # Add the crops to the plot
    # Rectangle 1: (x0, y0) & (x1, y1)
    crop1 = patches.Rectangle((x0, y0_B), x1 - x0, y1_B - y0_B, linewidth=2, edgecolor='green', facecolor='none',
                              label='Crop 1')
    plt.gca().add_patch(crop1)

    # Rectangle 2: (x1, y0) & (x2, y1)
    crop2 = patches.Rectangle((x1, y0_A), x2 - x1, y1_A - y0_A, linewidth=2, edgecolor='blue', facecolor='none',
                              label='Crop 2')
    plt.gca().add_patch(crop2)

    # Rectangle 3: (x0, y1) & (x3, y2)
    crop3 = patches.Rectangle((x0, y0_C), x3 - x0, y1_C - y0_C, linewidth=2, edgecolor='red', facecolor='none',
                              label='Crop 3')
    plt.gca().add_patch(crop3)

    # Show the plot with rectangles
    plt.show()

    # Create the crops dictionary
    crops = {
        'crop1': [[x0, y0_B], [x1, y1_B]],
        'crop2': [[x1, y0_A], [x2, y1_A]],
        'crop3': [[x0, y0_C], [x3, y1_C]]
    }

    return crops

def left_auto_cropper(points, num_points_per_edge, image_width, image_height):
    # Function to create a detailed polygon with more points
    def generate_polygon_with_details(points, num_points_per_edge):
        # Define the polygon using shapely
        poly = Polygon(points)

        # Extract edges
        edges = list(poly.exterior.coords)

        # Create a list to store detailed points
        detailed_points = []

        # Generate points on each edge
        for i in range(len(edges) - 1):
            start_point = np.array(edges[i])
            end_point = np.array(edges[i + 1])

            # Generate intermediate points
            for t in np.linspace(0, 1, num_points_per_edge):
                intermediate_point = start_point + t * (end_point - start_point)
                detailed_points.append(intermediate_point)

        # Close the polygon by adding the last point
        detailed_points.append(np.array(edges[-1]))

        return np.array(detailed_points)

    # Find point with the smallest y-value, but within an interval of the x-values
    def find_smallest_y_value_between_interval(points, interval_0, interval_1):

        # Find the point closest to the target_y with x-coordinate greater than half_width
        min_point = min([point for point in points if point[0] > interval_0 and point[0] < interval_1],
                        # Filter points where x lies in the interval between interval_0 and interval_1
                        key=lambda point: point[1])  # Find the point closest with the smallest y-value

        return min_point

    def find_most_right_and_left(points):
        # Find the point with the maximum x-coordinate (most right)
        most_right = max(points, key=lambda point: point[0])

        # Find the point with the minimum x-coordinate (most left)
        most_left = min(points, key=lambda point: point[0])

        return most_right, most_left

    # Function to calculate the distance between y_min and y_max
    def calculate_y_distance(points):
        # Extract the y-coordinates (second element of each pair)
        y_coordinates = [point[1] for point in points]

        # Find the minimum and maximum y-coordinates
        y_min = min(y_coordinates)
        y_max = max(y_coordinates)

        # Calculate the distance between y_min and y_max
        distance = y_max - y_min

        return y_min, y_max, distance

    # Function to calculate the most right point closest to 1/3 of the y-distance
    def find_left_point_closest_to_y_third(points, y_min, max_distance, image_width):
        # Calculate the target y-value, which is y_min + 1/3 of the provided y_max_distance
        target_y = y_min + (1 / 2) * max_distance

        half_width = image_width / 2
        # Find the point closest to the target_y with x-coordinate greater than half_width
        closest_point = min([point for point in points if point[0] < half_width],  # Filter points where x > half_width
                            key=lambda point: abs(point[1] - target_y)  # Find the point closest to target_y
                            )

        # Find the point with the largest x-coordinate (most right) closest to the target_y
        left_point = min(
            [point for point in points if abs(point[1] - closest_point[1]) < 1e-6 and point[0] < half_width],
            key=lambda point: point[0])

        return left_point

    x_boundary = image_width / 50
    y_boundary = image_height / 50

    detailed_points = generate_polygon_with_details(points, num_points_per_edge)

    # Convert to numpy array for easy plotting
    detailed_points = np.array(detailed_points)

    left_top = find_smallest_y_value_between_interval(detailed_points, 0, image_width / 3 * 2)

    print(f"The most top-left point is: {left_top}, with an y-value of: {left_top[1]}")

    # Call the function
    most_right_point, most_left_point = find_most_right_and_left(detailed_points)

    print(f"Most right point: {most_right_point}")
    print(f"Most left point: {most_left_point}")

    concatenated_points = np.vstack((most_left_point, left_top))

    # Call the function and print the result
    y_min_back_side, y_max_back_side, distance_back_side = calculate_y_distance(concatenated_points)
    print(f"The distance between y_min and y_max on the back sideline is: {distance_back_side}")

    # Call the function and print the result
    left_x_point = find_left_point_closest_to_y_third(detailed_points, y_min_back_side, distance_back_side, image_width)
    print(f"The most right point closest to 1/3 of the y-distance is: {left_x_point}")

    x0 = image_width
    x2 = left_x_point[0]
    x1 = x0 - ((x0 - x2) * 0.6)

    left_top_2 = find_smallest_y_value_between_interval(detailed_points, x1, x0)

    print(f"The most top-left point between the interval {x0, x1} is: {left_top_2}, with an y-value of: {left_top_2[1]}")

    # Call the function and print the result
    _, y_max, distance = calculate_y_distance(detailed_points)

    y0_A = max(0, left_top[1] - (2*y_boundary))
    x3 = max(0, most_left_point[0] - x_boundary)

    y0_B = max(0, left_top_2[1] - (2*y_boundary))
    y0_C = max(0, left_x_point[1] - y_boundary)
    y1_A = left_x_point[1] + (5 * y_boundary)
    y1_B = y0_B + distance / 2
    y1_C = min(y_max + y_boundary, image_height)

    # Plot the results with switched axes
    plt.figure(figsize=(16, 9))  # Adjust figure size to roughly match 1920x1080 ratio
    plt.plot(points[:, 0], points[:, 1], 'ro', label='Original Points')
    plt.plot(detailed_points[:, 0], detailed_points[:, 1], 'b-', label='Detailed Polygon', alpha=0.1)
    plt.title('Polygon with Detailed Edges')
    plt.xlabel('X')  # X-axis is now the original y-axis
    plt.ylabel('Y')  # Y-axis is now the original x-axis
    plt.xlim([0, image_width])
    plt.ylim([image_height, 0])
    plt.legend()
    plt.grid(True)

    # Add the crops to the plot
    # Rectangle 1: (x0, y0) & (x1, y1)
    crop1 = patches.Rectangle((x1, y0_B), x0 - x1, y1_B - y0_B, linewidth=2, edgecolor='green', facecolor='none',
                              label='Crop 1')
    plt.gca().add_patch(crop1)

    # Rectangle 2: (x1, y0) & (x2, y1)
    crop2 = patches.Rectangle((x2, y0_A), x1 - x2, y1_A - y0_A, linewidth=2, edgecolor='blue', facecolor='none',
                              label='Crop 2')
    plt.gca().add_patch(crop2)

    # Rectangle 3: (x0, y1) & (x3, y2)
    crop3 = patches.Rectangle((x3, y0_C), x0 - x3, y1_C - y0_C, linewidth=2, edgecolor='red', facecolor='none',
                              label='Crop 3')
    plt.gca().add_patch(crop3)

    # Show the plot with rectangles
    plt.show()

    # Create the crops dictionary
    crops = {
        'crop1': [[x1, y0_B], [x0, y1_B]],
        'crop2': [[x2, y0_A], [x1, y1_A]],
        'crop3': [[x3, y0_C], [x0, y1_C]]
    }

    return crops


def transform_crops_to_list(crops_dict):
    """
    Transforms a crops dictionary into a list of lists of lists in the format [[[x0, y0], [x1, y1]], ...].

    Parameters:
    - crops_dict: Dictionary of crops with keys like 'crop1', 'crop2', etc.

    Returns:
    - List of lists of lists in the format [[[x0, y0], [x1, y1]], ...]
    """
    # Convert coordinates to integers
    crops_list = [
        [
            [int(round(x0)), int(round(y0))],
            [int(round(x1)), int(round(y1))]
        ]
        for (x0, y0), (x1, y1) in crops_dict.values()
    ]

    return crops_list

def normalize_coordinates(crops_xyxy_left, image_width, image_height):
    normalized_crops = []
    for crop in crops_xyxy_left:
        # Divide the first coordinate through image_width and the second through image_height
        normalized_crop = [
            [round(crop[0][0] / image_width, 2), round(crop[0][1] / image_height, 2)],
            [round(crop[1][0] / image_width, 2), round(crop[1][1] / image_height, 2)]
        ]
        normalized_crops.append(normalized_crop)
    return normalized_crops

image_width, image_height = 1920, 1080

# List of points

# # #Example: Zeeburgia - Field 1
# left_outer_field_points = [[1805, 119], [1420, 1079], [1223, 1006], [903, 836], [625, 780], [113, 217], [1055, 59], [1746, 112]]
# right_outer_field_points = [[97, 152], [580, 1071], [715, 1064], [1054, 898], [1303, 848], [1820, 242], [868, 97], [416, 124]]

#Example: Zeeburgia - Field 2
left_outer_field_points = [[1732, 145], [1335, 1076], [960, 1077], [744, 1003], [110, 305], [1031, 107]]
right_outer_field_points = [[170, 74], [929, 44], [1911, 269], [1916, 317], [1147, 1055], [558, 1079]]
#
# #Example: RKC Waalwijk - Field 1
left_outer_field_points = [[1919, 248], [1919, 1044], [1049, 1076], [459, 891], [8, 675], [96, 626], [589, 424], [929, 305], [1039, 269], [1159, 257], [1443, 240], [1653, 232], [1918, 233]]
right_outer_field_points = [[1, 264], [1, 998], [1, 1077], [711, 1078], [1652, 790], [1919, 642], [1917, 598], [1589, 449], [1233, 320], [985, 242], [952, 240], [749, 230], [593, 225], [369, 227], [126, 240], [1, 250]]

# # #Example: KRC - Field 1
# left_outer_field_points = [[1920, 270], [1920, 281], [1284, 1079], [1165, 1073], [4, 405], [7, 357], [994, 171], [1046, 161]]
# right_outer_field_points = [[32, 1077], [7, 1077], [125, 183], [896, 99], [1781, 335], [1774, 350], [244, 1073]]
#
# # #Example: KRC - Field 2
# left_outer_field_points = [[1739, 174], [1890, 1078], [1677, 1077], [1384, 923], [1248, 888], [45, 363], [975, 99]]
# right_outer_field_points = [[21, 289], [695, 1077], [1872, 371], [864, 188]]
#
# # #Example: KRC - Field 3
# left_outer_field_points = [[1802, 180], [1508, 1078], [1293, 1074], [21, 281], [1030, 99]]
# right_outer_field_points = [[109, 183], [450, 1078], [603, 1073], [1842, 275], [892, 100]]
#
# # #Example: KRC - Field Jong Genk Side
# left_outer_field_points = [[1882, 237], [1668, 1077], [1406, 1079], [1, 439], [2, 349], [1000, 160]]
# right_outer_field_points = [[255, 1079], [22, 236], [880, 161], [1913, 366], [1916, 406], [379, 1077]]
#
# # #Example: KRC - Field 1 version 2
# left_outer_field_points = [[1901, 252], [1919, 290], [1307, 1079], [1111, 1024], [1, 396], [6, 355], [1045, 147]]
# right_outer_field_points = [[120, 186], [916, 102], [1852, 348], [1839, 374], [263, 1078], [3, 1078], [2, 1042]]
#
# # #Example: RSCA - Field 1 version 1
# left_outer_field_points = [[1836, 198], [1561, 1020], [1534, 1076], [1378, 1076], [1, 261], [0, 213], [1021, 105], [1842, 187]]
# right_outer_field_points = [[50, 231], [351, 1051], [379, 1076], [521, 1071], [1912, 253], [878, 137], [42, 218]]
#
# # #Example: RSCA - Field 2 version 1
# left_outer_field_points = [[1856, 170], [1605, 1006],[1568, 1075], [1446, 1063], [2, 264], [1, 236], [1032, 99], [1862, 160]]
# right_outer_field_points = [[77, 200], [389, 991],[459, 1076], [590, 1061], [1915, 303], [1912, 248], [876, 122], [70, 188]]
#
# # #Example: MyPitch - Gullegem
# left_outer_field_points = [[1760, 108], [1803, 1077], [1182, 1074], [63, 574], [985, 260], [1760, 98]]
# right_outer_field_points = [[194, 102], [177, 1077],[884, 1078], [1814, 667], [964, 311], [179, 92]]

# #Example: Provispo - KV Mechelen
left_outer_field_points = [[1764, 166], [1330, 1079], [1255, 1078], [861, 872], [698, 826], [106, 242], [1000, 77]]
right_outer_field_points = [[137, 118], [582, 1078], [661, 1078], [938, 925], [1200, 847], [1918, 232], [932, 39]]

#Make an array of both lists containing the outer_field_points
left_points = np.array(left_outer_field_points)
right_points = np.array(right_outer_field_points)

# Generate detailed points
num_points_per_edge = 1000

left_crops = left_auto_cropper(left_points, num_points_per_edge, image_width, image_height)
right_crops = right_auto_cropper(right_points, num_points_per_edge, image_width, image_height)

crops_xyxy_left = transform_crops_to_list(left_crops)
crops_xyxy_right = transform_crops_to_list(right_crops)

print('Generated crops_xyxy_left', crops_xyxy_left)
print('Generated crops_xyxy_right', crops_xyxy_right)

normalized_crops_xyxy_left = normalize_coordinates(crops_xyxy_left, image_width, image_height)
normalized_crops_xyxy_right = normalize_coordinates(crops_xyxy_right, image_width, image_height)

print('Generated normalized crops_xyxy_left', normalized_crops_xyxy_left)
print('Generated normalized crops_xyxy_right', normalized_crops_xyxy_right)

def plot_predefined_crops(points, num_points_per_edge, image_width, image_height, crops_xyxy):
    # Function to create a detailed polygon with more points
    def generate_polygon_with_details(points, num_points_per_edge):
        # Define the polygon using shapely
        poly = Polygon(points)

        # Extract edges
        edges = list(poly.exterior.coords)

        # Create a list to store detailed points
        detailed_points = []

        # Generate points on each edge
        for i in range(len(edges) - 1):
            start_point = np.array(edges[i])
            end_point = np.array(edges[i + 1])

            # Generate intermediate points
            for t in np.linspace(0, 1, num_points_per_edge):
                intermediate_point = start_point + t * (end_point - start_point)
                detailed_points.append(intermediate_point)

        # Close the polygon by adding the last point
        detailed_points.append(np.array(edges[-1]))

        return np.array(detailed_points)

    detailed_points = generate_polygon_with_details(points, num_points_per_edge)

    """
    Plots polygons and crops on a 2D plot.

    Parameters:
    - points: Array of original points to be plotted.
    - detailed_points: Array of detailed polygon points to be plotted.
    - image_width: Width of the image (used for setting x limits).
    - image_height: Height of the image (used for setting y limits).
    - crops_xyxy: List of crop coordinates where each crop is defined by two corners [[x0, y0], [x1, y1]].
    """
    # Create the figure and axis
    plt.figure(figsize=(16, 9))  # Adjust figure size to roughly match 1920x1080 ratio

    # Plot points and detailed polygon
    plt.plot(points[:, 0], points[:, 1], 'ro', label='Original Points')
    plt.plot(detailed_points[:, 0], detailed_points[:, 1], 'b-', label='Detailed Polygon', alpha=0.1)
    plt.title('Polygon with Detailed Edges')
    plt.xlabel('X')  # X-axis is now the original y-axis
    plt.ylabel('Y')  # Y-axis is now the original x-axis
    plt.xlim([0, image_width])
    plt.ylim([image_height, 0])
    plt.legend()
    plt.grid(True)

    # Add the crops to the plot
    colors = ['green', 'blue', 'red']
    for i, crop in enumerate(crops_xyxy):
        (x0, y0), (x1, y1) = crop
        crop_patch = patches.Rectangle((x0, y1), x1 - x0, y0 - y1, linewidth=2, edgecolor=colors[i], facecolor='none',
                                       label=f'Crop {i + 1}')
        plt.gca().add_patch(crop_patch)

    # Show the plot with rectangles
    plt.show()

    # Create the crops dictionary
    crops = {
        'crop1': crops_xyxy[0],
        'crop2': crops_xyxy[1],
        'crop3': crops_xyxy[2]
    }

    return crops

# predefined_crops_xyxy_left = [
#     [[400, 20], [1036, 250]],
#     [[1036, 49], [1700, 250]],
#     [[132, 250], [1816, 1080]]
# ]
#
# predefined_crops_xyxy_right = [
#     [[200, 50], [828, 250]],
#     [[828, 78], [1520, 250]],
#     [[84, 250], [1806, 1080]]
# ]

# predefined_crops_left = plot_predefined_crops(left_points, num_points_per_edge, image_width, image_height, predefined_crops_xyxy_left)
# predefined_crops_right = plot_predefined_crops(right_points, num_points_per_edge, image_width, image_height, predefined_crops_xyxy_right)
#
# normalized_predefined_crops_xyxy_left = normalize_coordinates(predefined_crops_xyxy_left, image_width, image_height)
# normalized_predefined_crops_xyxy_right = normalize_coordinates(predefined_crops_xyxy_right, image_width, image_height)
#
# print('Predefined crops_xyxy_left', normalized_predefined_crops_xyxy_left)
# print('Predefined crops_xyxy_right', normalized_predefined_crops_xyxy_right)

print("Done")
