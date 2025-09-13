import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import HomeComponent from "../../components/HomeComponent";

const mockProps = {
  setCurrentPage: () => {},
  setCurrentSetup: () => {},
  setCurrentSetupId: () => {},
};

describe("HomeComponent (no mocks)", () => {
  beforeEach(() => {
    render(<HomeComponent {...mockProps} />);
  });

  it("adds a new setup when there's text in the inputfield and the Add button is clicked", async () => {
    const input = screen.getByRole("textbox");
    const addButton = screen.getByRole("button", { name: /add/i });

    fireEvent.change(input, { target: { value: "Test Setup" } });
    fireEvent.click(addButton);

    // Wait for the new setup to appear in the list
    await waitFor(() => {
      expect(screen.getByText("Test Setup")).toBeInTheDocument();
    });

    // Input cleared after add
    expect(input.value).toBe("");
  });

  it("adds a new setup when there's text in the inputfield and Enter key is pressed", async () => {
    const input = screen.getByRole("textbox");

    fireEvent.change(input, { target: { value: "Test Setup 2" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Test Setup 2")).toBeInTheDocument();
    });

    expect(input.value).toBe("");
  });

  it("adds a setup then renames it when there's text in the rename input and Enter key is pressed", async () => {
    const input = screen.getByRole("textbox");
    const addButton = screen.getByRole("button", { name: /add/i });

    fireEvent.change(input, { target: { value: "Test Setup 3" } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText("Test Setup 3")).toBeInTheDocument();
    });

    expect(input.value).toBe("");

    // Click Rename button next to the existing setup
    const renameButton = screen.getByRole("button", { name: "Rename" });
    fireEvent.click(renameButton);

    // Find rename input by test id (assuming id 'rename-input-1' matches setup id)
    const renameInput = screen.getByTestId(/rename-input/i);

    fireEvent.change(renameInput, { target: { value: "Renamed Setup" } });
    fireEvent.keyDown(renameInput, { key: "Enter", code: "Enter" });

    // Wait for the renamed setup to appear
    await waitFor(() => {
      expect(screen.getByText("Renamed Setup")).toBeInTheDocument();
    });

    // Rename input should be gone after renaming
    expect(screen.queryByDisplayValue("Renamed Setup")).not.toBeInTheDocument();
  });
});
