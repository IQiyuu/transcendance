
export function    hide_menu(){
    let menu = document.getElementById("menu");
    if (menu != null)
        menu.classList.replace("block", "hidden");
}

export function    hide_tournament_form(){
    let el = document.getElementById("tournament_form");
    if (el != null)
        el.classList.replace("block", "hidden");
}

export function    hide_tournament_page(){
    let el = document.getElementById("tournament_page");
    el.classList.replace("flex", "hidden");
}
export function    remove_tournaments_join(){
    let el = document.getElementById("tournaments_list");
    if (el != null)
        el.removeChild(el.children[0]);
}

export function    print_tournament(data){
    let page = document.getElementById('tournament');
    page.style.display = "block";
}

export function    print_tournament_page(){
    let el = document.getElementById("tournament_page");
    el.classList.replace("hidden", "flex");
}


export function    print_tournament_form(){
    let tournament_creation_div = document.getElementById('tournament_form');
    tournament_creation_div.style.display = "block";
}

// modules.exports = {
//     hide_menu,
//     hide_tournament_form,
//     hide_tournament_page,
//     remove_tournaments_join,
//     print_tournament,
//     print_tournament_page,
//     print_tournament_form
// }
