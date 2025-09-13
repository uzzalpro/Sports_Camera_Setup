import axios from "axios"

export async function applyUndistortion(parameters, sourcePoints, destinationPoints, importedImg) {
    // let sourceImg = document.getElementById("pointImg")
    let sourceImg = importedImg
    let destinationImg = document.getElementById("distortionCanv")
    let sourceMat = cv.imread(sourceImg)
    let destinationMat = new cv.Mat()

    destinationImg.width = sourceImg.width
    destinationImg.height = sourceImg.height

    parameters = formatParameters(parameters, sourceImg.width, sourceImg.height)  // First format parameters before using them

    // matFromArray(matrix_rows, matrix_columns, 64bit_float, [focal_length_x, skew_x_y, principal_point_x, skew_x_y, 
    // focal_length_y, principal_point_y, homogeneous_translation, homogeneous_translation, homogeneous_coordinates])
    let cameraMatrix = cv.matFromArray(3, 3, cv.CV_64F, [parameters["w"], 0, parameters["x"], 0,
    parameters["h"], parameters["y"], 0, 0, 1])

    // matFromArray(matrix_rows, matrix_columns, 64bit_float, [k1, k2, p1,
    // p2, k3]); [...] = distortion coefficients
    let distCoeffs = cv.matFromArray(1, 5, cv.CV_64F, [parameters["k1"], parameters["k2"], parameters["p1"],
    parameters["p2"], parameters["k3"]])

    // Send API request to backend for cv2.undistortPoints and cv2.getOptimalNewCameraMatrix as arrays
    let undPointsAndCam = await undistortPointsAndCam(sourcePoints, cameraMatrix, distCoeffs, parameters["zoom"], sourceImg.width, sourceImg.height)  // Get array of undistorted source points
    let undistCam = cv.matFromArray(3, 3, cv.CV_64F, undPointsAndCam["undist_cam"].flat())  // Convert array of undist_cam values to a matrix

    cv.undistort(sourceMat, destinationMat, cameraMatrix, distCoeffs, undistCam)  // Apply the undistortion using the matrices
    cv.imshow("distortionCanv", destinationMat)  // Shows the undistorted image on the canvas
    
    let undSrcPoints = undPointsAndCam["undistorted_points"]  // Array of undistorted points
    
    let hgMatCopy = destinationMat.clone()  // Make a clone so the source points don't get drawn on it

    drawPointsOnCanvas(destinationImg, undSrcPoints)  // Draws the source points on the destination canvas

    applyHomography(hgMatCopy, undSrcPoints, destinationPoints)  // apply and show homography

    // Matrices cleanup
    sourceMat.delete()
    destinationMat.delete()
    cameraMatrix.delete()
    distCoeffs.delete()
    undistCam.delete()
}

// Format some parameters as percentages
function formatParameters(params, width, height) {
    params["x"] = params["x"] / 100 * width
    params["y"] = params["y"] / 100 * height
    params["w"] = params["w"] / 100 * width
    params["h"] = params["h"] / 100 * height

    return params
}

// Return array of undistorted points and array of getOptimalNewCameraMatrix() as an object
async function undistortPointsAndCam(srcPts, cameraMatrix, distCoeffs, zoom, imageWidth, imageHeight) { 
    let points = Object.values(srcPts).map(point => [point.x, point.y])

    let data = {
        "points": points,
        "camMatrix": Array.from(cameraMatrix.data64F),
        "distCoeffs": Array.from(distCoeffs.data64F),
        "zoom": zoom,
        "imageWidth": imageWidth,
        "imageHeight": imageHeight
    }

    let response = await axios.post(`${import.meta.env.VITE_API_URL}/api/undistort_points`, data)
    let responseData = response.data  // Contains array of undistorted points and array of getOptimalNewCameraMatrix

    return responseData

    // ---------------------------------------------------------------------------------
    // undistortPoints in js attempt

    // Extract the distortion coefficients
    // let k1 = distCoeffs.data64F[0];
    // let k2 = distCoeffs.data64F[1];
    // let p1 = distCoeffs.data64F[2];
    // let p2 = distCoeffs.data64F[3];
    // let k3 = distCoeffs.data64F[4];

    // // Extract camera matrix values
    // let fx = cameraMatrix.data64F[0];  // Focal length x
    // let fy = cameraMatrix.data64F[4];  // Focal length y
    // let cx = cameraMatrix.data64F[2];  // Principal point x
    // let cy = cameraMatrix.data64F[5];  // Principal point y

    // // Loop through each point and apply the undistortion formula
    // let undistortedPoints = [];
    // for (let i = 0; i < 4; i++) {
    //     let x = (points[i][0] - cx) / fx;
    //     let y = (points[i][1] - cy) / fy;

    //     // Iterative method to remove distortion (only 1 iteration here)
    //     let x0 = x, y0 = y;

    //     // Compute radius squared
    //     let r2 = x0 * x0 + y0 * y0;
    //     let r4 = r2 * r2;
    //     let r6 = r4 * r2;

    //     // Radial distortion
    //     let radialDistortion = 1 + k1 * r2 + k2 * r4 + k3 * r6;

    //     // Tangential distortion
    //     let deltaX = 2 * p1 * x0 * y0 + p2 * (r2 + 2 * x0 * x0);
    //     let deltaY = p1 * (r2 + 2 * y0 * y0) + 2 * p2 * x0 * y0;

    //     // Corrected coordinates
    //     let xCorrected = (x - deltaX) / radialDistortion;
    //     let yCorrected = (y - deltaY) / radialDistortion;

    //     // Back to pixel coordinates
    //     let u = xCorrected * fx + cx;
    //     let v = yCorrected * fy + cy;

    //     undistortedPoints.push([u, v]);
    // }

    // Print the undistorted points
    // console.log(undistortedPoints);

    // return undistortedPoints
}

// Draws the undistorted points on the distortion canvas
function drawPointsOnCanvas(canvas, points, color = "blue", radius = 10) {
    const ctx = canvas.getContext("2d")
    ctx.save()
    ctx.fillStyle = color
    ctx.strokeStyle = "black"
    ctx.lineWidth = 1
    ctx.font = `${radius + 14}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    points.forEach(([x, y], index) => {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        // Draw the number (index + 1)
        ctx.fillStyle = "yellow"
        ctx.fillText((index + 1).toString(), x, y)
        ctx.fillStyle = color
    })
    ctx.restore()
}


// Apply and show the homography result on a canvas
function applyHomography(srcMat, hgSourcePoints, hgDestinationPoints) {
    // let hgSourceImg = document.getElementById("distortionCanv")
    let hgDestinationImg = document.getElementById("hgDestinationCanv")
    
    // let hgSrcMat = cv.imread(hgSourceImg)
    let hgDstMat = new cv.Mat()

    // Map destination points from dictionary as an array
    let dstPts = Object.values(hgDestinationPoints).map(point => 
    [point.x, point.y])

    // Make matrices out of src and dst array
    let srcPtsMat = cv.matFromArray(hgSourcePoints.length, 1, cv.CV_32FC2, hgSourcePoints.flat())
    let dstPtsMat = cv.matFromArray(dstPts.length, 1, cv.CV_32FC2, dstPts.flat())

    // Set up homography matrix from the src and dst matrices
    let homography = cv.findHomography(srcPtsMat, dstPtsMat, cv.RANSAC, 5.0)

    // Apply image homography using the matrices with hgDstMat as output
    cv.warpPerspective(srcMat, hgDstMat, homography, new cv.Size(hgDstMat.width, hgDstMat.height))

    // Show the homography image on the canvas
    cv.imshow(hgDestinationImg, hgDstMat)

    // Matrices cleanup
    srcPtsMat.delete()
    dstPtsMat.delete()
    homography.delete()
    hgDstMat.delete()
}
