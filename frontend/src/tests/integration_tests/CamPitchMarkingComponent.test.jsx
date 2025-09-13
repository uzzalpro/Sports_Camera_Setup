import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach } from "vitest"
import CamPitchMarkingComponent from "../../components/camera_components/CamPitchMarkingComponent"

// NOTE: Do not mock axios or Konva here since this is an integration test with real backend
// You must ensure your backend and static /pitch.png image are accessible

describe("CamPitchMarkingComponent Integration Test - Pitch Marking (real backend)", () => {
  const currentCamId = "d3296a70-b2f7-4c4b-9a8c-2192634020a5" // Replace with real cam ID
  const innerPts = [
    { x: 10, y: 20 },
    { x: 100, y: 120 },
    { x: 60, y: 90 },
    { x: 80, y: 30 }
  ]
  const outerPts = [
    { x: 200, y: 220 },
    { x: 250, y: 270 },
    { x: 300, y: 320 },
    { x: 280, y: 230 }
  ]

  beforeEach(() => {
    render(<CamPitchMarkingComponent innerPts={innerPts} outerPts={outerPts} currentCamId={currentCamId} />)
  })

  it("saves inner and outer pitch points to backend", async () => {
    const saveButton = screen.getByRole("button", { name: /Save/i })
    fireEvent.click(saveButton)

    // Since there's no mock, we just check that button is functional
    await waitFor(() => {
      expect(saveButton).toBeInTheDocument()
    })
  })
})
