import React, { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import SidebarComponent from "../../components/SidebarComponent";

describe("SidebarComponent with state", () => {
  // A simple wrapper to manage currentPage state in test
  function SidebarWrapper() {
    const [currentPage, setCurrentPage] = useState("Home");
    return (
      <SidebarComponent
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentSetup="Setup 1"
        currentCamera="Camera A"
      />
    );
  }

  beforeEach(() => {
    render(<SidebarWrapper />);
  });

  it("renders all pages and highlights the active page", () => {
    const pages = ["Home", "Camera", "Overview", "Config"];
    pages.forEach((page) => {
      expect(screen.getByText(page)).toBeInTheDocument();
    });

    // Initially, "Home" is active
    const homeLink = screen.getByText("Home");
    expect(homeLink.className).toContain("active");

    // Other links are not active
    pages.filter((p) => p !== "Home").forEach((page) => {
      expect(screen.getByText(page).className).not.toContain("active");
    });
  });

  it("updates active page when a link is clicked", () => {
    const cameraLink = screen.getByText("Camera");
    fireEvent.click(cameraLink);

    // Now "Camera" should have active class
    expect(cameraLink.className).toContain("active");

    // "Home" should no longer be active
    expect(screen.getByText("Home").className).not.toContain("active");

    screen.debug(); // See updated DOM with active class on "Camera"

    const configLink = screen.getByText("Config");
    fireEvent.click(configLink);

    expect(configLink.className).toContain("active");
    expect(screen.getByText("Camera").className).not.toContain("active");
  });
});
