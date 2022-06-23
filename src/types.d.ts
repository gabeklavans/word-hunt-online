type Tile = {
    letter: string;
    container?: Phaser.GameObjects.Container;
    row: number;
    col: number;
};

type BoardLetters = [
    string, // 1
    string, // 2
    string, // 3
    string, // 4
    string, // 5
    string, // 6
    string, // 7
    string, // 8
    string, // 9
    string, // 10
    string, // 11
    string, // 12
    string, // 13
    string, // 14
    string, // 15
    string // 16
];

type BoardData = {
    board: BoardLetters;
    words: string[];
};

type SessionView = {
    board?: BoardData;
    scoredUsers: {
        [key: string]: {
            score: number;
            words: string[];
            name: string;
        };
    };
    done: boolean;
};
