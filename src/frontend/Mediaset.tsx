import { Container } from "@nextui-org/react";
import React, { useEffect, useState } from "react";
import { MediaSet } from "../entities/MediaSet";
import { ApiClient } from "./ApiClient";
import { QueryParams } from "./QueryParams";

const client = new ApiClient();
const setId = QueryParams.getParams()["setId"];
export function Mediaset() {
  useEffect(() => {
    if (setId) {
      client.getSetAsync(setId).then(set => setSet(set));
    }
  }, [])

  const [set, setSet] = useState<MediaSet<any> | undefined>(undefined)
  return <Container>
    {set && <h1>{set?.name}</h1>}
  </Container>
}