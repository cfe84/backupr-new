export class QueryParams {
  static getParams(): { [key: string]: string | undefined } {
    const params: { [key: string]: string } = {}
    let queryParams = window.location.search.substring(1);
    queryParams.split("&").forEach(p => {
      let idx = p.indexOf("=");
      if (idx < 0) {
        idx = p.length;
      }
      params[p.substring(0, idx)] = p.substring(idx + 1);
    });
    return params;
  }
}