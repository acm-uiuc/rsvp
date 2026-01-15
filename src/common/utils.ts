export function getBaseUrl() {
    if(window.location.hostname === 'localhost') {
        return 'https://core.aws.qa.acmuiuc.org/';
    } else {
        return 'https://core.acm.illinois.edu/';
    }
}

export function getTurnstileKey() {
    if(window.location.hostname === 'localhost') {
        return '1x00000000000000000000AA';
    } else {
        return '0x4AAAAAACLtNvWF7VjCKZfe';
    }
}