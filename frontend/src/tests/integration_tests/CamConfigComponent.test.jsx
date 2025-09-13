import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import CamConfigComponent from "../../components/camera_components/CamConfigComponent";

describe("CamConfigComponent Integration Test - Load, Edit, Save (real backend)", () => {
  const currentCamId = "d3296a70-b2f7-4c4b-9a8c-2192634020a5"; // Replace with valid camera ID
  const defaultConfig = {
    resolution_width: 1920,
    resolution_height: 1080,
    position: "Top Left",
    cropping_type: "None",
    time_correction: 100
  };

  beforeEach(() => {
    render(<CamConfigComponent config={defaultConfig} currentCamId={currentCamId} />);
  });

  it("updates config values and triggers save", async () => {
    const updates = {
      resolution_width: "1280",
      resolution_height: "720",
      position: "Bottom Right",
      cropping_type: "Edge",
      time_correction: "250"
    };

    for (const [key, value] of Object.entries(updates)) {
      const label = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ":";
      const input = screen.getByLabelText(label);
      fireEvent.change(input, { target: { value } });
    }

    fireEvent.click(screen.getByText("Save"));
  });
});
