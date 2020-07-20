let SkillSearchFormula = {
    tokensWithValue: ['c', 'e', 'n'],
    flagTokens: ['cd', 'lb', 'active', 'passive', 'magic'],
    operators: ['>', '=', '<'],

    parseFormula: (formulaString) => {
        formulaString = formulaString.trim();
        formulaString = formulaString.replace(/\s+/g,' ');
        let pos = 0;
        const tokens = [];
        while (pos < formulaString.length) {
            let tokenData = SkillSearchFormula.getNextToken(formulaString, pos);
            tokens.push(tokenData.token);
            pos += tokenData.readChars;
        }
        return tokens
    },

    getNextToken: (formulaString, posInFormula) => {
        let pos = posInFormula;
        let state = 'token';
        const nextToken = {
            token: '',
            value: ''
        };
        let openedQuote = false;
        while(pos < formulaString.length) {
            var char = formulaString.substr(pos, 1);
            switch(state) {
                case 'token':
                    if (char.match(/[a-z]/i)) {
                        nextToken.token += char;
                        if (SkillSearchFormula.tokensWithValue.includes(nextToken.token)) {
                            state = 'operator';
                        } else if (SkillSearchFormula.flagTokens.includes(nextToken.token)) {
                            state = 'finished';
                        }
                    } else if (char == '!' && nextToken.token == '') {
                        nextToken.not = true;
                    } else {
                        throw nextToken.token + char + ' is not a valid token at position ' + pos;
                    }
                    break;
                case 'operator':
                    if (SkillSearchFormula.operators.includes(char)) {
                        nextToken.operator = char;
                        state = 'value';
                    } else {
                        throw char + ' is not a valid operator at position ' + pos;
                    }
                    break;
                case 'value':
                    if (openedQuote) {
                        nextToken.value += char;
                    } else {
                        if (char == '"') {
                            if (nextToken.value == '') {
                                openedQuote = true;
                            } else {
                                throw 'unexpected quote at ' + pos;
                            }
                        } else if (char.match(/[a-z0-9]/i)) {
                            nextToken.value += char;
                        } else {
                            state = 'finished';
                            pos--;
                        }
                    }
                    break;
                case 'finished':
                    if (char == ' ') {
                        return {
                            token: nextToken,
                            readChars: pos - posInFormula + 1,
                        };
                    } else {
                        throw 'Unexpected character ' + char + ' at ' + pos;
                    }
            }
            pos++;
        }
        switch(state) {
            case 'token':
                throw nextToken.token + ' is not a valid token at position ' + posInFormula;
            case 'operator':
                throw nextToken.token + ' is not a valid token at position ' + posInFormula;
            case 'value':
                if (openedQuote) {
                    throw 'unclosed quote';
                } else {
                    return {
                        token: nextToken,
                        readChars: pos - posInFormula,
                    };
                }
            case 'finished':
                return {
                    token: nextToken,
                    readChars: pos - posInFormula,
                };
        }
    },

    getMatcherFromFormula: (formulaSttring) => {
        return SkillSearchFormula.getAndMatcher(SkillSearchFormula.parseFormula(formulaSttring));
    },

    getAndMatcher: (tokens) => {
        let matchers = tokens.map(token => SkillSearchFormula.getMatcher(token));
        if (matchers.length === 1) {
            return matchers[0];
        } else {
            return (skill, type) => {
                return matchers.every(matcher => matcher(skill, type));
            }
        }
    },

    getMatcher: (token) => {
        let matcherFunction;
        switch (token.token) {
            case 'c':
                matcherFunction = (skill, type) => {
                    if (type != 'active') {
                        return false;
                    }
                }
                break;
            case 'e':
                break;
            case 'n':
                break;
            case 'cd':
                break;
            case 'lb':
                matcherFunction = (skill, type) => type == 'lb';
                break;
            case 'active':
                matcherFunction = (skill, type) => type == 'active';
                break;
            case 'passive':
                matcherFunction = (skill, type) => type == 'passive';
                break;
            case 'magic':
                matcherFunction = (skill, type) => type == 'magic';
                break;
        }
        if (token.not) {
            matcherFunction = (skill, type) => !matcherFunction(skill, type);
        }
        return matcherFunction;
    }
}
