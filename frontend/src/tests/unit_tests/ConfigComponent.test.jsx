// src/tests/ConfigComponent.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ConfigComponent from "../../components/ConfigComponent";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("ConfigComponent", () => {
  const mockConfig = {
    device_type: "USB",
    timestamp_start: "2024-01-01T00:00:00",
    timestamp_end: "2024-01-01T01:00:00",
    extract_data_path: "/data/output",
    stop_team_after: 5,
    tracker_type: "basic",
    output_fps: 30,
    debug_visualize: true
  };

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: mockConfig });

    render(<ConfigComponent currentSetupId={123} />);
    
    // Wait for config to load
    await waitFor(() => {
      expect(screen.getByLabelText("Device Type:")).toBeInTheDocument();
    });
  });

  it("calls axios.patch with updated config on Save", async () => {
    axios.patch.mockResolvedValue({});

    const input = screen.getByLabelText("Device Type:");
    const checkbox = screen.getByLabelText("Debug Visualize:");
    const button = screen.getByText("Save");

    // Perform changes
    fireEvent.change(input, { target: { value: "HDMI" } });
    fireEvent.click(checkbox); // toggle checkbox

    fireEvent.click(button);

    // AFTER Save
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
      expect.stringContaining("/api/setup/123"),
      {},
      { params: expect.objectContaining({ device_type: "HDMI", debug_visualize: false }) }
      );
    });
  });
});
