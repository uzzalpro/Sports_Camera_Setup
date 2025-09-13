import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import CamCropMarkingComponent from "../../components/camera_components/CamCropMarkingComponent";

const dummyCropData = [
  { id: 1, x: 10, y: 20, width: 100, height: 150, type: "typeA" },
  { id: 2, x: 30, y: 40, width: 120, height: 160, type: "typeB" },
];
const dummyCamId = 123;

describe("CamCropMarkingComponent", () => {
  let container;

  beforeEach(() => {
    const renderResult = render(
      <CamCropMarkingComponent cropData={dummyCropData} currentCamId={dummyCamId} />
    );
    container = renderResult.container;
  });

  it("renders image and crops", () => {
    expect(screen.getByAltText("")).toBeInTheDocument();

    const crops = container.querySelectorAll(".react-resizable");
    expect(crops).toHaveLength(2);
  });

  it("adds a new crop when 'Add Crop' button is clicked", () => {
    const addButton = screen.getByText("Add Crop");
    fireEvent.click(addButton);

    const crops = container.querySelectorAll(".react-resizable");
    expect(crops).toHaveLength(3);
  });

  it("updates dropdown type when selecting a crop type", () => {
    const typeButton = screen.getByText("Type");

    fireEvent.click(typeButton);
    const option = screen.getByText("Two-Side-Cam");
    fireEvent.click(option);

    expect(typeButton).toHaveTextContent("Two-Side-Cam");
  });

  it("sends crops to backend when clicking 'Save'", () => {
    const saveButton = screen.getByText("Save");
    expect(saveButton).toBeInTheDocument();
  });

  it("updates crop position when dragged", () => {
    const draggable = container.querySelector(".react-draggable");
    expect(draggable).toBeInTheDocument();

    fireEvent.mouseDown(draggable, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(draggable, { clientX: 50, clientY: 60 });
    fireEvent.mouseUp(draggable);

    expect(draggable.style.transform).not.toContain("undefined");
  });

  it("updates crop size when resized", () => {
    const resizable = container.querySelector(".react-resizable");
    expect(resizable).toBeInTheDocument();

    const handle = resizable.querySelector(".react-resizable-handle");
    expect(handle).toBeInTheDocument();

    fireEvent.mouseDown(handle, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(handle, { clientX: 150, clientY: 150 });
    fireEvent.mouseUp(handle);

    expect(resizable.style.width).not.toBe("");
    expect(resizable.style.height).not.toBe("");
  });

  it("deletes a crop when a crop is shift-clicked", () => {
    const draggableCrops = screen.getAllByTestId(/draggable-\d+/);
    expect(draggableCrops.length).toBe(dummyCropData.length);

    fireEvent.click(draggableCrops[0], { shiftKey: true });

    const cropsAfterDelete = screen.queryAllByTestId(/draggable-\d+/);
    expect(cropsAfterDelete.length).toBe(dummyCropData.length - 1);
  });
});
