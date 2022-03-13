export namespace jsx {
    enum tokenType {
        domStart_start,
        domEnd_start,
        dom_end,

        cmd,
        space,
        same,
        string,
    };

    class token {
        type: tokenType;
        data: string;

        constructor(type_: tokenType, data_: string) {
            this.type = type_;
            this.data = data_;
        }
    };

    export const setting = {
        "domMaker": "Var.make",
        "textMaker": "Var.text",
        "stateMaker": "Var.state"
    };

    export const parseText = (text: string): string => {
        let startNum = -1;
        let endNum = -1;

        for (let i = 0; i < text.length; i++) {
            const nowChar: string = <string>text[i];
            if (nowChar !== `\n` && nowChar !== ` `) {
                startNum = i;
                break;
            }
        }

        for (let i = text.length - 1; i >= 0; i--) {
            const nowChar: string = <string>text[i];
            if (nowChar !== `\n` && nowChar !== ` `) {
                endNum = i;
                break;
            }
        }

        if (startNum === -1 || endNum == -1)
            return ``;

        return text.slice(startNum, endNum + 1);
    };

    const parser = (code: string): Array<token> => {
        const tokens: Array<token> = [];

        code = code.replaceAll(`<-`, "${").replaceAll(`->`, `}`);

        for (let nowIndex = 0; nowIndex < code.length; nowIndex++) {
            if (code[nowIndex] == `<`) {
                if (code[nowIndex + 1] == `/`) {
                    tokens.push(new token(tokenType.domEnd_start, `</`));
                    nowIndex++;
                }
                else
                    tokens.push(new token(tokenType.domStart_start, `<`));
            }
            else if (code[nowIndex] == `>`)
                tokens.push(new token(tokenType.dom_end, `>`));
            else if (code[nowIndex] == `"`) {
                let data = "";
                while (code[++nowIndex] != `"`)
                    data += code[nowIndex];

                tokens.push(new token(tokenType.string, data));
            }
            else if (code[nowIndex] == ` `)
                tokens.push(new token(tokenType.space, ` `));
            else if (code[nowIndex] == `=`)
                tokens.push(new token(tokenType.same, `=`));
            else {
                if (tokens.length == 0 || tokens[tokens.length - 1].type != tokenType.cmd)
                    tokens.push(new token(tokenType.cmd, code[nowIndex]));
                else
                    tokens[tokens.length - 1] = new token(tokenType.cmd, tokens[tokens.length - 1].data + code[nowIndex]);
            }
        }

        return tokens;
    };

    const join = (tokens: Array<token>): string => {
        let code = "";
        for (let nowToken of tokens) {
            if (nowToken.type == tokenType.string)
                code += `"${nowToken.data}"`;
            else
                code += nowToken.data;
        }

        return code;
    }

    class domPart {
        startIndex: number;
        endIndex: number;

        constructor(startIndex_: number, endIndex_: number) {
            this.startIndex = startIndex_;
            this.endIndex = endIndex_;
        }
    }

    class dom {
        startIndex: domPart;
        endIndex: domPart;
        child: Array<dom>;

        constructor(startIndex_: domPart, endIndex_: domPart, child_: Array<dom>) {
            this.startIndex = startIndex_;
            this.endIndex = endIndex_;
            this.child = child_;
        }
    }

    class state {
        key: string;
        data: string;

        constructor(key_: string, data_: string) {
            this.key = key_;
            this.data = data_;
        }
    }

    const getState = (tokens: Array<token>): Array<state> => {
        let returnState: Array<state> = [];
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].type == tokenType.cmd)
                returnState.push(new state(tokens[i].data, ``));
            if (tokens[i].type == tokenType.same) {
                returnState[returnState.length - 1] = new state(returnState[returnState.length - 1].data, tokens[i + 1].data);
                i++;
            }
        }

        return returnState;
    }

    const makeJs_state = (states: Array<state>): string => {
        let returnCode: Array<string> = [];

        for (let state of states) {
            returnCode.push(`${setting.stateMaker}(\`${state.key}\`,\`${state.data}\`)`);
        }

        return `[${returnCode.join(`,`)}]`;
    }

    const makeJs_dom = (name: string, states: string, childs: string) => {
        return `${setting.domMaker}(\`${name}\`,${states},${childs})`;
    }

    const makeJs_text = (value: string) => {
        if (parseText(value) !== ``)
            return `${setting.textMaker}(\`${parseText(value)}\`)`;
        else
            return ``;
    }

    const makeJs_child = (tokens: Array<token>, myDom: dom): string => {
        let returnTokens: Array<token> = [];
        let nowText: Array<token> = [];
        let nowDom_index = 0;

        for (let i = myDom.startIndex.endIndex + 1; i < myDom.endIndex.startIndex; i++) {
            if (nowDom_index < myDom.child.length && i == myDom.child[nowDom_index].startIndex.startIndex) {
                if (nowText.filter(text => text.type === tokenType.cmd).length != 0)
                    returnTokens.push(new token(tokenType.cmd, makeJs_text(nowText.map(element => element.data).join(``))));
                nowText = [];

                returnTokens.push(new token(tokenType.cmd, htmlToJsx(tokens, myDom.child[nowDom_index])));
                i = myDom.child[nowDom_index].endIndex.endIndex;
                nowDom_index++;
            }
            else
                nowText.push(tokens[i]);
        }

        if (nowText.filter(text => text.type === tokenType.cmd).length != 0)
            returnTokens.push(new token(tokenType.cmd, makeJs_text(nowText.map(element => element.data).join(``))));

        return returnTokens.map(element => element.data).join(`,`);
    }

    const htmlToJsx = (tokens: Array<token>, myDom: dom): string => {
        const startTokens = tokens.slice(myDom.startIndex.startIndex + 1, myDom.startIndex.endIndex).filter(myToken => myToken.type !== tokenType.space);

        const name = startTokens[0].data;
        const states = getState(startTokens.slice(1, startTokens.length));
        const childs = makeJs_child(tokens, myDom);

        return makeJs_dom(name, makeJs_state(states), childs);
    };

    const sub = (tokens: Array<token>, doms: Array<dom>): Array<token> => {
        const returnTokens: Array<token> = [];
        let nowDom_num = 0;

        for (let index = 0; index < tokens.length; index++) {
            if (nowDom_num < doms.length && index == doms[nowDom_num].startIndex.startIndex) {
                returnTokens.push(new token(tokenType.cmd, htmlToJsx(tokens, doms[nowDom_num])));
                index = doms[nowDom_num].endIndex.endIndex;

                nowDom_num++;
            }
            else
                returnTokens.push(tokens[index]);
        }

        return returnTokens;
    };

    const make = (tokens: Array<token>): string => {
        let dom_start: Array<number> = [];
        let dom_end: Array<number> = [];

        let domStart: Array<domPart> = [];
        let doms: Array<dom> = [];

        for (let index = 0; index < tokens.length; index++) {
            const nowToken = tokens[index];

            if (nowToken.type == tokenType.domStart_start)
                dom_start.push(index);
            else if (nowToken.type == tokenType.domEnd_start)
                dom_end.push(index);
            else if (nowToken.type == tokenType.dom_end) {
                if (dom_end.length != 0) {
                    const firstPart = domStart[domStart.length - 1];
                    const lastPart = new domPart(dom_end[dom_end.length - 1], index);
                    const child: Array<dom> = [];

                    for (let i = 0; i < doms.length; i++) {
                        if (doms[i].startIndex.startIndex > firstPart.startIndex) {
                            child.push(doms[i]);
                            doms.splice(i, 1);
                            i--;
                        }
                    }

                    dom_end.pop();
                    domStart.pop();

                    doms.push(new dom(firstPart, lastPart, child));
                }
                else {
                    const firstIndex = dom_start[dom_start.length - 1];
                    const lastIndex = index;
                    dom_start.pop();

                    domStart.push(new domPart(firstIndex, lastIndex));
                }
            }
        }

        return join(sub(tokens, doms));
    };

    export const translate = (code: string): string => {
        return make(parser(code));
    }
};