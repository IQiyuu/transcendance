import {SiteController} from "./SiteController.js";

async function main(){
    let view = new SiteController();
    await view.initLang();
    view.add_events();
}

await main();
