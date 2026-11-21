"use client";

import { useEffect } from "react";
import { connectHomeNavTheme } from "./home-nav-theme";

export function HomeNavEnhancement() {
  useEffect(connectHomeNavTheme, []);
  return null;
}
