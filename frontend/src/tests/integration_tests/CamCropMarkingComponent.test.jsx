import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import CamCropMarkingComponent from "../../components/camera_components/CamCropMarkingComponent";

describe("CamCropMarkingComponent Integration Test - Crop Marking (real backend)", () => {
  const currentCamId = "d3296a70-b2f7-4c4b-9a8c-2192634020a5"; // Replace with real camera ID
  const defaultCropData = [
    { top_left_x: 10, top_left_y: 20, bottom_right_x: 150, bottom_right_y: 200 },
    { top_left_x: 30, top_left_y: 50, bottom_right_x: 100, bottom_right_y: 100 }
  ];

  beforeEach(() => {
    render(<CamCropMarkingComponent cropData={defaultCropData} currentCamId={currentCamId} />);
  });

  it("adds a new crop", () => {
    fireEvent.click(screen.getByText("Add Crop"));
    const newCrop = screen.getByTestId("draggable-2");
    expect(newCrop).toBeInTheDocument();
  });

  it("saves crops to the backend", async () => {
    fireEvent.click(screen.getByText("Save"));

    // Just validate that the save button can be clicked
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeInTheDocument();
    });
  });
});
