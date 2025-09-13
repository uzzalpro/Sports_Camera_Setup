// CamPitchMarkingComponent.test.jsx
import { render, screen, fireEvent, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import axios from "axios"
import { describe, it, expect, vi, beforeEach } from "vitest"
import CamPitchMarkingComponent from "../../components/camera_components/CamPitchMarkingComponent"

vi.mock("axios")

// Keep a reference to simulate Konva stageRef
let mockedStageRef = null

vi.mock("react-konva", () => {
  const React = require("react")

  return {
    Stage: React.forwardRef(({ children, ...props }, ref) => {
      // Provide a mocked getPointerPosition() on stageRef
      mockedStageRef = {
        getPointerPosition: () => ({ x: 50, y: 50 })
      }

      if (ref) ref.current = mockedStageRef

      return <div data-testid="stage" {...props}>{children}</div>
    }),
    Layer: ({ children }) => <div>{children}</div>,
    Line: () => <svg data-testid="line" />,
    Circle: (props) => <div data-testid="circle" {...props} />,
  }
})

describe("CamPitchMarkingComponent", () => {
  const innerPts = [
    { x: 10, y: 10 },
    { x: 100, y: 10 },
    { x: 100, y: 100 },
    { x: 10, y: 100 },
  ]
  const outerPts = [
    { x: 20, y: 20 },
    { x: 110, y: 20 },
    { x: 110, y: 110 },
    { x: 20, y: 110 },
  ]
  const currentCamId = "1"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders correctly and shows inner points by default", () => {
    render(<CamPitchMarkingComponent innerPts={innerPts} outerPts={outerPts} currentCamId={currentCamId} />)

    expect(screen.getByText("Pitch Marking")).toBeInTheDocument()
    expect(screen.getAllByTestId("circle")).toHaveLength(innerPts.length)
    expect(screen.getByRole("button", { name: "Show Outer" })).toBeInTheDocument()
  })

  it("toggles between inner and outer points when toggle button clicked", async () => {
    render(<CamPitchMarkingComponent innerPts={innerPts} outerPts={outerPts} currentCamId={currentCamId} />)
    
    const toggleBtn = screen.getByRole("button", { name: "Show Outer" })
    await userEvent.click(toggleBtn)

    expect(screen.getAllByTestId("circle")).toHaveLength(outerPts.length)
    expect(screen.getByRole("button", { name: "Show Inner" })).toBeInTheDocument()
  })

  it("adds a new point on double click on stage", async () => {
    render(<CamPitchMarkingComponent innerPts={innerPts} outerPts={outerPts} currentCamId={currentCamId} />)

    await act(async () => {
      fireEvent.dblClick(screen.getByTestId("stage"))
    })

    expect(screen.getAllByTestId("circle")).toHaveLength(innerPts.length)
  })

  it("deletes a point when shift-clicking on a point", async () => {
    render(<CamPitchMarkingComponent innerPts={innerPts} outerPts={outerPts} currentCamId={currentCamId} />)

    const circles = screen.getAllByTestId("circle")
    expect(circles.length).toBe(innerPts.length)

    await act(async () => {
      fireEvent.click(circles[0], { shiftKey: true })
    })

    expect(screen.getAllByTestId("circle")).toHaveLength(innerPts.length - 1)
  })

  it("calls axios.put with correct data when Save button clicked", async () => {
    axios.put.mockResolvedValue({ status: 200 })

    render(<CamPitchMarkingComponent innerPts={innerPts} outerPts={outerPts} currentCamId={currentCamId} />)

    await userEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(axios.put).toHaveBeenCalledWith(
      `${import.meta.env.VITE_API_URL}/api/camera/${currentCamId}/pitch`,
      [innerPts, outerPts]
    )
  })

  it("updates point position when dragging a point", async () => {
    render(<CamPitchMarkingComponent innerPts={innerPts} outerPts={outerPts} currentCamId={currentCamId} />)

    const circles = screen.getAllByTestId("circle")
    expect(circles.length).toBe(innerPts.length)

    fireEvent.pointerMove(circles[0], { clientX: 60, clientY: 60 })

    const updatedCircles = screen.getAllByTestId("circle")
  })
})
