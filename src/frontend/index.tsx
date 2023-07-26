import React, { ReactElement } from "react";
import ReactDom from "react-dom";

import { MainPage } from "./MainPage";
import { Mediaset } from "./Mediaset";

function modulize(element: ReactElement) {
  return (containerId: string) => {
    window.onload = () => {
      const container = document.getElementById(containerId);
      ReactDom.render(element, container);
    }
  };
}

const modules: { [key: string]: any } = {
  loadMainPage: modulize(<MainPage></MainPage>),
  loadMediaset: modulize(<Mediaset></Mediaset>)
};

Object.keys(modules).forEach(k => {
  (window as any)[k] = modules[k];
})