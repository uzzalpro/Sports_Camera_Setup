import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import CamConfigComponent from "../../components/camera_components/CamConfigComponent"
import axios from "axios"

vi.mock("axios")

describe("CamConfigComponent", () => {
  const dummyId = 1
  const dummyConfig = {
    resolution_width: "1920",
    resolution_height: "1080",
    position: "front",
    cropping_type: "none",
    time_correction: "42"
  }

  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
    render(<CamConfigComponent config={dummyConfig} currentCamId={dummyId} />)
  })

  it("renders all input fields based on config keys", () => {
    Object.keys(dummyConfig).forEach(key => {
      const labelRegex = new RegExp(key.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), 'i')
      expect(screen.getByLabelText(labelRegex)).toBeInTheDocument()
    })
  })

  it("updates input value and triggers axios.patch on save", async () => {
    const resolutionInput = screen.getByLabelText(/resolution width/i)
    fireEvent.change(resolutionInput, { target: { value: "1280" } })

    const saveButton = screen.getByText("Save")
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/camera/${dummyId}`),
        {},
        { params: expect.objectContaining({ resolution_width: "1280" }) }
      )
    })
  })
})
