import React, { useEffect, useState } from "react";
import { Button, Card } from "@nextui-org/react";
import { ApiClient } from "./ApiClient";
import { MediaSet } from "../entities/MediaSet";
import { MediasetHeader } from "../webserver/dtos/MediasetHeader";

export interface MediassetListDeps {
  client: ApiClient
}

export function MediasetList(deps: MediassetListDeps) {
  const [sets, setSets] = useState<MediasetHeader[]>([]);

  useEffect(() => {
    deps.client.getSetsAsync().then(sets => setSets(sets))
  }, []);

  return <div>
    {sets.map(set => {
      return <Card about={set.description} key={set.id}><Button onClick={() => { window.location.replace(`/mediaset?setId=${set.id}`) }} >
        {set.name}
      </Button></Card>
    })}
  </div>
}