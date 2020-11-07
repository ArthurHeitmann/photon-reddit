export let isLoggedIn: boolean = false;

export function setIsLoggedIn(newIsLoggedIn: boolean): boolean {
    return isLoggedIn = newIsLoggedIn;
}

export let thisUserName = "";

export function setThisUserName(newUserName: string) {
    thisUserName = newUserName;
}

