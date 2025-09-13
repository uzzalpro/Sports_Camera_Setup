import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DetectorComponent from "../../components/config_components/DetectorComponent";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("DetectorComponent", () => {
  const mockDetectorList = [
    { id: "1", config: { detector_model: "YOLOv5", image_size: 640 } },
    { id: "2", config: { detector_model: "SSD", image_size: 512 } }
  ];

  beforeEach(async () => {
    axios.get.mockResolvedValue({ data: mockDetectorList });

    render(<DetectorComponent currentSetupId={123} />);

    // Wait for detector list to load
    await waitFor(() => {
      expect(screen.getByText("Detector Configuration")).toBeInTheDocument();
    });
  });

  it("renders the detector list after load", () => {
    fireEvent.click(screen.getByText("Select"));
    mockDetectorList.forEach((det) => {
      expect(screen.getByText(JSON.stringify(det.config))).toBeInTheDocument();
    });
    screen.debug()
  });

  it("adds a new detector to the list", async () => {
    axios.post.mockResolvedValue({ data: "3" });

    fireEvent.click(screen.getByText("Add"));

    await waitFor(() => {
      fireEvent.click(screen.getByText("Select"));
      expect(screen.getByText(JSON.stringify({ detector_model: "", image_size: 0 }))).toBeInTheDocument();
    });
  });

  it("selects a detector and updates input fields", () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockDetectorList[0].config)));

    expect(screen.getByLabelText("Detector Model:")).toBeInTheDocument();
    expect(screen.getByLabelText("Image Size:")).toBeInTheDocument();
    expect(screen.getByLabelText("Detector Model:").value).toBe("YOLOv5");
  });

  it("updates input fields and sends updated config", async () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockDetectorList[1].config)));

    const input = screen.getByLabelText("Detector Model:");
    fireEvent.change(input, { target: { value: "SSD-Lite" } });
    expect(input.value).toBe("SSD-Lite");

    const saveButton = screen.getByText("Save");
    axios.patch.mockResolvedValue({});
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/detector/2"),
        {}, // empty body
        expect.objectContaining({
          params: expect.objectContaining({ detector_model: "SSD-Lite" }),
        })
      );
    });
  });

  it("assigns selected detector to setup", async () => {
    fireEvent.click(screen.getByText("Select"));
    fireEvent.click(screen.getByText(JSON.stringify(mockDetectorList[0].config)));

    axios.patch.mockResolvedValue({});
    fireEvent.click(screen.getByText("Assign"));

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/detector/2"),
        {}, // empty body
        expect.objectContaining({
          params: expect.objectContaining({ detector_model: "SSD-Lite" }),
        })
      );
    });
  });
});
