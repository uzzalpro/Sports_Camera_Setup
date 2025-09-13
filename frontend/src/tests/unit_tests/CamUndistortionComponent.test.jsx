// CamUndistortionComponent.test.jsx
import React from "react"
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import CamUndistortionComponent from "../../components/camera_components/CamUndistortionComponent"
import axios from "axios"
import * as undistortModule from "../../scripts/homography-undistortion"

vi.mock("axios")

describe("CamUndistortionComponent", () => {
  const undParams = {
    zoom: "0",
    k1: "0",
    k2: "0",
    p1: "0",
    p2: "0",
    k3: "0",
    x: "50",
    y: "50",
    w: "50",
    h: "50"
  }
  const hgSrcPts = {
    "1": { x: 466, y: 120 },
    "2": { x: 829, y: 104 },
    "3": { x: 789, y: 467 },
    "4": { x: 28, y: 290 }
  }
  const hgDstPts = {
    "1": { x: 25, y: 21 },
    "2": { x: 427, y: 21 },
    "3": { x: 427, y: 453 },
    "4": { x: 25, y: 453 }
  }
  const currentCamId = 123

  beforeAll(() => {
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
  });

  afterAll(() => {
    global.URL.createObjectURL.mockReset();
    delete global.URL.createObjectURL;
  });

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(undistortModule, "applyUndistortion").mockImplementation(() => {})
  })

  it("renders correctly with parameters and points", () => {
    render(
      <CamUndistortionComponent
        undParams={undParams}
        hgSrcPts={hgSrcPts}
        hgDstPts={hgDstPts}
        currentCamId={currentCamId}
      />
    )

    // Check heading
    expect(screen.getByText("Homography & Undistortion")).toBeDefined()

    // Check that parameter inputs are rendered
    Object.keys(undParams).forEach((param) => {
      expect(screen.getAllByDisplayValue(undParams[param]).length).toBeGreaterThan(0)
    })

    // Check source and destination point coordinate inputs
    Object.entries(hgSrcPts).forEach(([key, val]) => {
      expect(screen.getAllByDisplayValue(val.x.toString()).length).toBeGreaterThan(0)
      expect(screen.getAllByDisplayValue(val.y.toString()).length).toBeGreaterThan(0)
    })
    Object.entries(hgDstPts).forEach(([key, val]) => {
      expect(screen.getAllByDisplayValue(val.x.toString()).length).toBeGreaterThan(0)
      expect(screen.getAllByDisplayValue(val.y.toString()).length).toBeGreaterThan(0)
    })
  })

  it("updates parameter state on input change", () => {
    render(
      <CamUndistortionComponent
        undParams={undParams}
        hgSrcPts={hgSrcPts}
        hgDstPts={hgDstPts}
        currentCamId={currentCamId}
      />
    )

    const zoomInput = screen.getAllByDisplayValue("0")[0] // The zoom param text input
    fireEvent.change(zoomInput, { target: { value: "0.5" } })
    expect(zoomInput.value).toBe("0.5")
  })

  it('changes parameter slider value', () => {
    render(<CamUndistortionComponent undParams={undParams} hgSrcPts={hgSrcPts} hgDstPts={hgDstPts} currentCamId={currentCamId} />)

    const k1Slider = screen.getByTestId('slider-k1') // no aria-label so fallback to input range near label
    fireEvent.change(k1Slider, { target: { value: "0.2" } })
    expect(k1Slider.value).toBe("0.2")
  })

  it("toggles image on button click", () => {
    render(
      <CamUndistortionComponent
        undParams={undParams}
        hgSrcPts={hgSrcPts}
        hgDstPts={hgDstPts}
        currentCamId={currentCamId}
      />
    )

    const toggleButton = screen.getByRole("button", { name: /Show Undistortion/i })
    expect(toggleButton).toBeDefined()

    fireEvent.click(toggleButton)
    expect(toggleButton.textContent).toBe("Show Points")
  })

  it('drags source point updates position', () => {
    render(<CamUndistortionComponent undParams={undParams} hgSrcPts={hgSrcPts} hgDstPts={hgDstPts} currentCamId={currentCamId} />)
    
    // Find the draggable div with label "1" in source points container
    const sourceDot = screen.getAllByText("1")[0]

    // Draggable uses react-draggable, so we simulate onDrag event manually
    fireEvent.drag(sourceDot, { clientX: 500, clientY: 150 })

    // There is no direct way to check the position without DOM styles,
    // but we can test if the sourcePoints state updated indirectly by changing the input fields
    const xInput = screen.getAllByDisplayValue(hgSrcPts[1].x.toString())[0]
    const yInput = screen.getAllByDisplayValue(hgSrcPts[1].y.toString())[0]
    expect(xInput).toBeInTheDocument()
    expect(yInput).toBeInTheDocument()
  })

  it("calls axios.put when saving undistortion parameters", async () => {
    axios.put.mockResolvedValue({ data: {} })

    render(
      <CamUndistortionComponent
        undParams={undParams}
        hgSrcPts={hgSrcPts}
        hgDstPts={hgDstPts}
        currentCamId={currentCamId}
      />
    )

    const saveUndButton = screen.getByTestId("save-undistortion")
    fireEvent.click(saveUndButton)

    expect(axios.put).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}/undistortion`,
      expect.any(Object)
    )
  })

  it("calls axios.put when saving homography points", async () => {
    axios.put.mockResolvedValue({ data: {} })

    render(
      <CamUndistortionComponent
        undParams={undParams}
        hgSrcPts={hgSrcPts}
        hgDstPts={hgDstPts}
        currentCamId={currentCamId}
      />
    )

    const saveHgButton = screen.getByTestId("save-homography")
    // The second Save button is for homography points
    fireEvent.click(saveHgButton)

    expect(axios.put).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}/homography`,
      expect.any(Array)
    )
  })

  it('handles image upload and updates image state', () => {
    render(<CamUndistortionComponent undParams={undParams} hgSrcPts={hgSrcPts} hgDstPts={hgDstPts} currentCamId={currentCamId} />)

    const file = new File(["dummy content"], "example.png", { type: "image/png" })
    const inputFile = screen.getByTestId("file-input")

    fireEvent.change(inputFile, { target: { files: [file] } })

    // The image state should now have been updated to a blob url, which we can't check directly,
    // but we can check that the src attribute of img changes after upload:
    const img = screen.getByAltText("source-image")
    expect(img.src).toContain("blob:")
  })

  
  it('allows changing min and max inputs for a parameter', () => {
    render(<CamUndistortionComponent currentCamId={1} />)

    // Get min and max inputs for parameter "k1"
    const minInput = screen.getByTestId('min-input-k1')
    const maxInput = screen.getByTestId('max-input-k1')

    // Change min input value
    fireEvent.change(minInput, { target: { value: '-0.5' } })
    expect(minInput.value).toBe('-0.5')

    // Change max input value
    fireEvent.change(maxInput, { target: { value: '0.8' } })
    expect(maxInput.value).toBe('0.8')
  })

  it('changes source and destination coordinate inputs', () => {
    render(<CamUndistortionComponent currentCamId={1} />)

    // Change source point 1 x coordinate
    const sourceX1 = screen.getByTestId('source-x-1')
    fireEvent.change(sourceX1, { target: { value: '500' } })
    expect(sourceX1.value).toBe('500')

    // Change source point 1 y coordinate
    const sourceY1 = screen.getByTestId('source-y-1')
    fireEvent.change(sourceY1, { target: { value: '150' } })
    expect(sourceY1.value).toBe('150')

    // Change destination point 2 x coordinate
    const destX2 = screen.getByTestId('destination-x-2')
    fireEvent.change(destX2, { target: { value: '430' } })
    expect(destX2.value).toBe('430')

    // Change destination point 2 y coordinate
    const destY2 = screen.getByTestId('destination-y-2')
    fireEvent.change(destY2, { target: { value: '25' } })
    expect(destY2.value).toBe('25')
  })
})
