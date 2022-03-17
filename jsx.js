"use strict";
exports.__esModule = true;
exports.jsx = void 0;
var jsx;
(function (jsx) {
    var tokenType;
    (function (tokenType) {
        tokenType[tokenType["domStart_start"] = 0] = "domStart_start";
        tokenType[tokenType["domEnd_start"] = 1] = "domEnd_start";
        tokenType[tokenType["dom_end"] = 2] = "dom_end";
        tokenType[tokenType["cmd"] = 3] = "cmd";
        tokenType[tokenType["space"] = 4] = "space";
        tokenType[tokenType["same"] = 5] = "same";
        tokenType[tokenType["string"] = 6] = "string";
        tokenType[tokenType["varStart"] = 7] = "varStart";
        tokenType[tokenType["varEnd"] = 8] = "varEnd";
    })(tokenType || (tokenType = {}));
    ;
    var token = /** @class */ (function () {
        function token(type_, data_) {
            this.type = type_;
            this.data = data_;
        }
        return token;
    }());
    ;
    jsx.setting = {
        "domMaker": "Var.make",
        "textMaker": "Var.text",
        "stateMaker": "Var.state",
        "chageMaker": "Var.change"
    };
    jsx.parseText = function (text) {
        var startNum = -1;
        var endNum = -1;
        for (var i = 0; i < text.length; i++) {
            var nowChar = text[i];
            if (nowChar !== "\n" && nowChar !== " ") {
                startNum = i;
                break;
            }
        }
        for (var i = text.length - 1; i >= 0; i--) {
            var nowChar = text[i];
            if (nowChar !== "\n" && nowChar !== " ") {
                endNum = i;
                break;
            }
        }
        if (startNum === -1 || endNum == -1)
            return "";
        return text.slice(startNum, endNum + 1);
    };
    var str_varChange = function (value) {
        return value.replaceAll("<-", "${").replaceAll("->", "}");
    };
    var parser = function (code) {
        var tokens = [];
        for (var nowIndex = 0; nowIndex < code.length; nowIndex++) {
            if (code[nowIndex] == "<" && code[nowIndex + 1] == "-") {
                tokens.push(new token(tokenType.varStart, "${"));
                nowIndex++;
            }
            else if (code[nowIndex] == "-" && code[nowIndex + 1] == ">") {
                tokens.push(new token(tokenType.varEnd, "}"));
                nowIndex++;
            }
            else if (code[nowIndex] == "<") {
                if (code[nowIndex + 1] == "/") {
                    tokens.push(new token(tokenType.domEnd_start, "</"));
                    nowIndex++;
                }
                else
                    tokens.push(new token(tokenType.domStart_start, "<"));
            }
            else if (code[nowIndex] == ">")
                tokens.push(new token(tokenType.dom_end, ">"));
            else if (code[nowIndex] == "\"") {
                var data = "";
                while (code[++nowIndex] != "\"")
                    data += code[nowIndex];
                tokens.push(new token(tokenType.string, data));
            }
            else if (code[nowIndex] == " ")
                tokens.push(new token(tokenType.space, " "));
            else if (code[nowIndex] == "=")
                tokens.push(new token(tokenType.same, "="));
            else {
                if (tokens.length == 0 || tokens[tokens.length - 1].type != tokenType.cmd)
                    tokens.push(new token(tokenType.cmd, code[nowIndex]));
                else
                    tokens[tokens.length - 1] = new token(tokenType.cmd, tokens[tokens.length - 1].data + code[nowIndex]);
            }
        }
        return tokens;
    };
    var join = function (tokens) {
        var code = "";
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var nowToken = tokens_1[_i];
            if (nowToken.type == tokenType.string)
                code += "\"".concat(nowToken.data, "\"");
            else
                code += nowToken.data;
        }
        return code;
    };
    var domPart = /** @class */ (function () {
        function domPart(startIndex_, endIndex_) {
            this.startIndex = startIndex_;
            this.endIndex = endIndex_;
        }
        return domPart;
    }());
    var dom = /** @class */ (function () {
        function dom(startIndex_, endIndex_, child_) {
            this.startIndex = startIndex_;
            this.endIndex = endIndex_;
            this.child = child_;
        }
        return dom;
    }());
    var state = /** @class */ (function () {
        function state(key_, data_) {
            this.key = key_;
            this.data = data_;
        }
        return state;
    }());
    var getState = function (tokens) {
        var returnState = [];
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i].type == tokenType.cmd)
                returnState.push(new state(tokens[i].data, ""));
            if (tokens[i].type == tokenType.same) {
                returnState[returnState.length - 1] = new state(returnState[returnState.length - 1].key, tokens[i + 1].data);
                i++;
            }
        }
        return returnState;
    };
    var makeJs_state = function (states) {
        var returnCode = [];
        for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
            var state_1 = states_1[_i];
            returnCode.push("".concat(jsx.setting.stateMaker, "(`").concat(state_1.key, "`,`").concat(str_varChange(state_1.data), "`)"));
        }
        return "[".concat(returnCode.join(","), "]");
    };
    var makeJs_dom = function (name, states, childs) {
        if (jsx.parseText(childs) === "")
            return "".concat(jsx.setting.domMaker, "(`").concat(name, "`,").concat(states, ")");
        else
            return "".concat(jsx.setting.domMaker, "(`").concat(name, "`,").concat(states, ",").concat(childs, ")");
    };
    var makeJs_text = function (value) {
        if (jsx.parseText(value) !== "")
            return "".concat(jsx.setting.textMaker, "(`").concat(jsx.parseText(value), "`)");
        else
            return "";
    };
    var makeJs_change = function (value) {
        return "".concat(jsx.setting.chageMaker, "(").concat(value, ")");
    };
    var makeJs_child = function (tokens, myDom) {
        var returnTokens = [];
        var nowText = [];
        var nowDom_index = 0;
        var isVar = [];
        for (var i = myDom.startIndex.endIndex + 1; i < myDom.endIndex.startIndex; i++) {
            if (nowText.length > 0 && nowText[0].type === tokenType.varStart && tokens[i].type === tokenType.varEnd) {
                isVar.pop();
                if (isVar.length === 0) {
                    returnTokens.push(new token(tokenType.cmd, makeJs_change(make(nowText.slice(1, nowText.length)))));
                    nowText = [];
                }
                else
                    nowText.push(tokens[i]);
            }
            else if (i < myDom.endIndex.startIndex && tokens[i].type === tokenType.varStart) {
                if (isVar.length === 0) {
                    if (makeJs_text(nowText.map(function (element) { return element.data; }).join("")) !== "")
                        returnTokens.push(new token(tokenType.cmd, makeJs_text(nowText.map(function (element) { return element.data; }).join(""))));
                    nowText = [];
                }
                isVar.push(true);
                nowText.push(tokens[i]);
            }
            else if ((nowDom_index < myDom.child.length && i == myDom.child[nowDom_index].startIndex.startIndex)) {
                if (nowText.filter(function (text) { return text.type === tokenType.cmd; }).length != 0) {
                    if (makeJs_text(nowText.map(function (element) { return element.data; }).join("")) !== "")
                        returnTokens.push(new token(tokenType.cmd, makeJs_text(nowText.map(function (element) { return element.data; }).join(""))));
                }
                nowText = [];
                returnTokens.push(new token(tokenType.cmd, htmlToJsx(tokens, myDom.child[nowDom_index])));
                i = myDom.child[nowDom_index].endIndex.endIndex;
                nowDom_index++;
            }
            else
                nowText.push(tokens[i]);
        }
        if (nowText.filter(function (text) { return text.type === tokenType.cmd; }).length != 0)
            if (makeJs_text(nowText.map(function (element) { return element.data; }).join("")) !== "")
                returnTokens.push(new token(tokenType.cmd, makeJs_text(nowText.map(function (element) { return element.data; }).join(""))));
        return returnTokens.map(function (element) { return element.data; }).join(",");
    };
    var htmlToJsx = function (tokens, myDom) {
        var startTokens = tokens.slice(myDom.startIndex.startIndex + 1, myDom.startIndex.endIndex).filter(function (myToken) { return myToken.type !== tokenType.space; });
        var name = startTokens[0].data;
        var states = getState(startTokens.slice(1, startTokens.length));
        var childs = makeJs_child(tokens, myDom);
        return makeJs_dom(name, makeJs_state(states), childs);
    };
    var sub = function (tokens, doms) {
        var returnTokens = [];
        var nowDom_num = 0;
        for (var index = 0; index < tokens.length; index++) {
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
    var make = function (tokens) {
        var dom_start = [];
        var dom_end = [];
        var domStart = [];
        var doms = [];
        var varList = [];
        for (var index = 0; index < tokens.length; index++) {
            var nowToken = tokens[index];
            if (nowToken.type == tokenType.varStart)
                varList.push(true);
            if (nowToken.type == tokenType.varEnd)
                varList.pop();
            if (!varList.length) {
                if (nowToken.type == tokenType.domStart_start)
                    dom_start.push(index);
                else if (nowToken.type == tokenType.domEnd_start)
                    dom_end.push(index);
                else if (nowToken.type == tokenType.dom_end) {
                    if (dom_end.length != 0) {
                        var firstPart = domStart[domStart.length - 1];
                        var lastPart = new domPart(dom_end[dom_end.length - 1], index);
                        var child = [];
                        for (var i = 0; i < doms.length; i++) {
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
                        var firstIndex = dom_start[dom_start.length - 1];
                        var lastIndex = index;
                        dom_start.pop();
                        domStart.push(new domPart(firstIndex, lastIndex));
                    }
                    "";
                }
            }
        }
        return join(sub(tokens, doms));
    };
    jsx.translate = function (code) {
        return make(parser(code));
    };
})(jsx = exports.jsx || (exports.jsx = {}));
;
