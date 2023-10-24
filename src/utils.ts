export function getWordScore(word: string) {
    let score = 0;
    for (let i = 3; i <= word.length; i++) {
        // trying to emulate what I'm seeing in the scores of word hunt
        switch (i) {
            case 3:
                score += 100;
                break;
            case 4:
                score += 300;
                break;
            case 6:
                score += 600;
                break;
            default:
                score += 400;
        }
    }
    return score;
}

export function pointExitRect(rect: Phaser.Geom.Rectangle, x: number, y: number) {
    return x < 0 || y < 0 || x > rect.width || y > rect.height;
}
