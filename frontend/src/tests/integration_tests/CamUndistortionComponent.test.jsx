import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import CamUndistortionComponent from "../../components/camera_components/CamUndistortionComponent"
import { describe, it, vi, beforeEach } from "vitest"
import * as undistortModule from "../../scripts/homography-undistortion"

// Optionally, clear window.cv if needed
beforeEach(() => {
  vi.spyOn(undistortModule, "applyUndistortion").mockImplementation(() => {})
});

const undParams = {
  zoom: "0.5", k1: "0.1", k2: "0.1", p1: "0.01", p2: "0.01",
  k3: "0.05", x: "10", y: "20", w: "30", h: "40"
}

const hgSrcPts = {
  "1": { x: 100, y: 100 },
  "2": { x: 200, y: 100 },
  "3": { x: 200, y: 200 },
  "4": { x: 100, y: 200 }
}

const hgDstPts = {
  "1": { x: 10, y: 10 },
  "2": { x: 300, y: 10 },
  "3": { x: 300, y: 300 },
  "4": { x: 10, y: 300 }
}

describe("CamUndistortionComponent Integration Tests", () => {
  it("saves undistortion params to backend (real request)", async () => {
    render(
      <CamUndistortionComponent
        undParams={undParams}
        hgSrcPts={hgSrcPts}
        hgDstPts={hgDstPts}
        currentCamId={"1219e84f-0b24-4844-9e70-218d2efb78d6"}
      />
    )

    fireEvent.click(screen.getByTestId("save-undistortion"))
  })

  it("saves homography points to backend (real request)", async () => {
    render(
      <CamUndistortionComponent
        undParams={undParams}
        hgSrcPts={hgSrcPts}
        hgDstPts={hgDstPts}
        currentCamId={"1219e84f-0b24-4844-9e70-218d2efb78d6"}
      />
    )

    fireEvent.click(screen.getByTestId("save-homography"))
  })
})
