/// <reference types="vitest" />

import React from "react"
import { describe, it, beforeEach, vi, expect } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import CameraComponent from "../../components/CameraComponent"
import axios from "axios"

// Mock CSS module (must export a `default`)
vi.mock("../styles/CameraComponent.module.css", () => ({
  default: {
    cameraSelection: "cameraSelection",
    dropdown: "dropdown",
    // Add more class names here if your component uses others like styles.button, etc.
  }
}))


// Mock subcomponents to isolate CameraComponent behavior
vi.mock("../components/camera_components/CamConfigComponent", () => ({
  default: () => <div data-testid="CamConfigComponent" />
}))
vi.mock("../components/camera_components/CamPitchMarkingComponent", () => ({
  default: () => <div data-testid="CamPitchMarkingComponent" />
}))
vi.mock("../components/camera_components/CamCropMarkingComponent", () => ({
  default: () => <div data-testid="CamCropMarkingComponent" />
}))
vi.mock("../components/camera_components/CamUndistortionComponent", () => ({
  default: () => <div data-testid="CamUndistortionComponent" />
}))

// Mock axios
vi.mock("axios")

describe("CameraComponent", () => {
  const setupId = "123"
  const mockCameras = [
    { camera_id: "cam1", camera_name: "Front Cam" },
    { camera_id: "cam2", camera_name: "Back Cam" }
  ]
  const mockConfig = {
    config: {},
    innerPoints: [],
    outerPoints: [],
    crops: [],
    undistortion: {},
    source_points: [],
    destination_points: []
  }

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes(`/api/setup/${setupId}/camera`)) {
        return Promise.resolve({ data: mockCameras })
      }
      if (url.includes(`/api/camera/cam1`)) {
        return Promise.resolve({ data: mockConfig })
      }
    })

    axios.post.mockResolvedValue({ data: "newCamId" })
    axios.patch.mockResolvedValue({})
    axios.delete.mockResolvedValue({})
  })

  it("renders input and add button", async () => {
    render(<CameraComponent currentSetupId={setupId} setCurrentCamera={() => {}} />)
    expect(await screen.findByText("Camera")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument()
  })

  it("shows camera list in dropdown and selects a camera", async () => {
    render(<CameraComponent currentSetupId={setupId} setCurrentCamera={() => {}} />)

    fireEvent.click(await screen.findByRole("button", { name: "Choose Camera" }))
    fireEvent.click(await screen.findByRole("button", { name: "Front Cam" }))

    await waitFor(() => {
      expect(screen.getByTestId("CamConfigComponent")).toBeInTheDocument()
      expect(screen.getByTestId("CamPitchMarkingComponent")).toBeInTheDocument()
      expect(screen.getByTestId("CamCropMarkingComponent")).toBeInTheDocument()
      expect(screen.getByTestId("CamUndistortionComponent")).toBeInTheDocument()
    })
  })

  it("adds a camera via button", async () => {
    render(<CameraComponent currentSetupId={setupId} setCurrentCamera={() => {}} />)

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "New Camera" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled()
    })
  })

  it("deletes the selected camera", async () => {
    render(<CameraComponent currentSetupId={setupId} setCurrentCamera={() => {}} />)

    fireEvent.click(await screen.findByRole("button", { name: "Choose Camera" }))
    fireEvent.click(await screen.findByRole("button", { name: "Front Cam" }))
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled()
    })
  })

  it("renames camera", async () => {
    render(<CameraComponent currentSetupId={setupId} setCurrentCamera={() => {}} />)

    fireEvent.click(await screen.findByRole("button", { name: "Choose Camera" }))
    fireEvent.click(await screen.findByRole("button", { name: "Front Cam" }))
    fireEvent.click(await screen.findByRole("button", { name: "Rename" }))

    const input = await screen.findByDisplayValue("Front Cam")
    fireEvent.change(input, { target: { value: "Renamed Cam" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalled()
    })
  })
})
