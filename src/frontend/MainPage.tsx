import React from "react";
import { MediasetList } from "./MediasetList";
import { ApiClient } from "./ApiClient";

const client = new ApiClient();

export function MainPage() {
  return <MediasetList client={client}></MediasetList>
}