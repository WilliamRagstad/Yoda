class Token {
    public readonly Type: TokenType;
    public Value: string;

    constructor(type: TokenType, value: string) {
        this.Type = type;
        this.Value = value;
    }
}

enum TokenType {
    LBracket = "LBracket",
    RBracket = "RBracket",
    LCurlyBracket = "LCurlyBracket",
    RCurlyBracket = "RCurlyBracket",
    LParenthasis = "LParenthasis",
    RParenthasis = "RParenthasis",
    Comma = "Comma",
    Dot = "Dot",
    SemiColon = "SemiColon",
    Function = "Function",
    Return = "Return",
    If = "If",
    Else = "Else",
    Addition = "Addition",
    Subtraction = "Subtraction",
    Multiplication = "Multiplication",
    Division = "Division",
    Modulus = "Modulus",
    Assignment = "Assignment",

    Whitespace = "Whitespace",
    Comment = "Comment",
    Literal = "Literal",
    String = "String",
    Number = "Number",

    Equality = "Equality",
    LessThan = "LessThan",
    GreaterThan = "GreaterThan",
    LessThanEquals = "LessThanEquals",
    GreaterThanEquals = "GreaterThanEquals",
    ArrowFunction = "ArrowFunction",
    MinusEquals = "MinusEquals",
    TimesEquals = "TimesEquals",
    DivideEquals = "DivideEquals",
    For = "For",
    Switch = "Switch",
    Try = "Try",
    Catch = "Catch",
    Decrement = "Decrement",
    Increment = "Increment",
    PlusEquals = "PlusEquals",
    LogicalNot = "LogicalNot",
    RaisedTo = "RaisedTo",
    AritmeticAnd = "AritmeticAnd",
    AritmeticOr = "AritmeticOr",
    LogicalAnd = "LogicalAnd",
    LogicalOr = "LogicalOr",
    ModulusEquals = "ModulusEquals"
}

class ASTNode<T = unknown> {
    public readonly Type: NodeType;
    public Value: T;
    public Children: ASTNode[];

    constructor(type: NodeType, value: T = null, children: ASTNode[] = []) {
        this.Type = type;
        this.Value = value;
        this.Children = children;
    }

    public GetType(type: NodeType): ASTNode {
        for (let i = 0; i < this.Children.length; i++) {
            const child = this.Children[i];
            if (child.Type == type) return child;
        }
        return null;
    }

    public GetNode(index: number): ASTNode {
        return this.Children[index];
    }

    public GetPreviousNode(): ASTNode {
        return this.GetNode(this.Children.length - 1);
    }

    public RemoveNode(index: number): void {
        this.Children.splice(index);
    }

    public RemovePreviousNode(): void {
        this.RemoveNode(this.Children.length - 1);
    }

    public AddNode<T = unknown>(node: ASTNode<T>) {
        this.Children.push(node);
    }
    public AddNodes<T = unknown>(nodes: ASTNode<T>[]) {
        nodes.forEach(n => {
            this.AddNode<T>(n);
        });
    }
}

class AST extends ASTNode<void> {
    constructor() {
        super(NodeType.Root);
    }
}

enum NodeType {
    Root = "Root",
    Block = "Block",
    Expression = "Expression",
    AssignmentExpression = "AssignmentExpression",
    InfixExpression = "InfixExpression",
    Assignee = "Assignee",
    Function = "Function",
    FunctionName = "FunctionName",
    FunctionParameters = "FunctionParameters",
    Instruction = "Instruction",
    InstructionName = "InstructionName",
    InstructionArguments = "InstructionArguments",
    CodeBlock = "CodeBlock",
    If = "If",
    IfCondition = "IfCondition",
    ElIf = "ElIf",
    ElIfCondition = "ElIfCondition",
    Else = "Else",
    Return = "Return",
    For = "For",
    ForParameters = "ForParameters",
    IncDec = "IncDec",
}


const Yoda = {
    LoadScripts: function(debugMode: boolean = false) {
        if (debugMode) console.log("Loading Yoda scripts...")
        let scripts = document.querySelectorAll("script[src$='.yoda']"); // *= works aswell...
        for (let i = 0; i < scripts.length; i++) {
            fetch(scripts[i].getAttribute("src"))
            .then(r => r.text())
            .then(t => {
                let code = this.Transpile(t, debugMode)
                
                this.Inject(code, scripts[i]);
                scripts[i].remove();
            });
            
        }
    },
    Inject: function(jsCode: string, element: HTMLScriptElement) {
        let e = document.createElement("script");
        e.innerHTML = jsCode;
        element.parentElement.appendChild(e);
    },
    Transpile: function(sourceCode: string, debugMode: boolean = false, generator: Function = this.Generators.toJS): string {
        let tokens: Token[] = this.Tokenize(sourceCode);
        let ast: AST = this.Parse(tokens);
        let result: string = generator.call(this,ast);

        if (debugMode) console.log(
            sourceCode + '\n\n\n',
            tokens,
            ast,
            '\n\n\n' + result);
        
        return result;
    },
    Tokenize: function(inputStream: string): Token[] {
        let tokens: Token[] = [];
        let ct: string = "";

        function addToken(type: TokenType, overrideValue: string = null): void {
            if (overrideValue != null && ct.length > 0) {
                switch(ct) {
                    case "return":
                        addToken(TokenType.Return);
                        break;
                    case "function":
                        addToken(TokenType.Function);
                        break;
                    case "for":
                        addToken(TokenType.For);
                        break;
                    case "switch":
                        addToken(TokenType.Switch);
                        break;
                    case "try":
                        addToken(TokenType.Try);
                        break;
                    case "catch":
                        addToken(TokenType.Catch);
                        break;
                    case "if":
                        addToken(TokenType.If);
                        break;
                    case "else":
                        addToken(TokenType.Else);
                        break;
                    default:
                        addToken(TokenType.Literal);
                        break;
                }
            }
            if (type != TokenType.Whitespace) // Ignore whitespace
                tokens.push(new Token(
                    type,
                    overrideValue != null ? overrideValue : ct
                ));
            ct = "";
        }
        function isNum(char: string) {
            let n = Number.parseInt(char);
            if (char == '.' || !isNaN(n)) return true;
            return false;
        }

        let i: number;
        function getChar(index: number = i) { return inputStream[index] ?? null; }

        for (i = 0; i < inputStream.length; i++) {
            let cc = getChar();
            let nc = getChar(i + 1);
        
            function readWhile(condition: Function) {
                while(cc != null && condition(cc)) {
                    ct += cc;
                    cc = getChar(++i);
                }
                i--;
            }

            function readNumber() {
                // Read number
                readWhile(c => isNum(c));
                addToken(TokenType.Number);
            }

            switch(cc) {
                case '\0':
                case '\n':
                case '\r':
                case ' ':
                    if (ct.length > 0) addToken(TokenType.Whitespace, cc)
                    break;
                case '{':
                    addToken(TokenType.LCurlyBracket, cc);
                    break;
                case '}':
                    addToken(TokenType.RCurlyBracket, cc);
                    break;
                case '[':
                    addToken(TokenType.LBracket, cc);
                    break;
                case ']':
                    addToken(TokenType.RBracket, cc);
                    break;
                case '(':
                    addToken(TokenType.LParenthasis, cc);
                    break;
                case ')':
                    addToken(TokenType.RParenthasis, cc);
                    break;
                case ',':
                    addToken(TokenType.Comma, cc);
                    break;
                case '.':
                    if (isNum(nc)) readNumber();
                    else addToken(TokenType.Dot, cc);
                    break;
                case '+':
                    if (nc == '=') {
                        i++;
                        addToken(TokenType.PlusEquals, "+=");
                    }
                    else if (nc == '+') {
                        i++;
                        addToken(TokenType.Increment, "++");
                    }
                    else addToken(TokenType.Addition, cc);
                    break;
                case '-':
                    if (nc == '=') {
                        i++;
                        addToken(TokenType.MinusEquals);
                    }
                    else if (nc == '-') {
                        i++;
                        addToken(TokenType.Decrement, "--");
                    }
                    else addToken(TokenType.Subtraction, cc);
                    break;
                case '*':
                    if (nc == '=') {
                        i++;
                        addToken(TokenType.TimesEquals, "*=");
                    }
                    else if (nc == '*') {
                        i++;
                        addToken(TokenType.RaisedTo, "**");
                    }
                    else addToken(TokenType.Multiplication, cc);
                    break;
                case '/':
                    if (nc == '=') {
                        i++;
                        addToken(TokenType.DivideEquals, "/=");
                    }
                    else if (nc == '/') {
                        // Comment
                        readWhile(c => c != '\n');
                        addToken(TokenType.Comment);
                    }
                    else addToken(TokenType.Division, cc);
                    break;
                case '%':
                    if (nc == '=') {
                        i++;
                        addToken(TokenType.ModulusEquals, "/=");
                    }
                    else addToken(TokenType.Modulus, cc);
                    break;
                case '=':
                    if (nc == '=') {
                        i++;
                        addToken(TokenType.Equality, "==");
                    }
                    else if (nc == '>') {
                        i++;
                        addToken(TokenType.ArrowFunction, "=>");
                    }
                    else addToken(TokenType.Assignment, cc);
                    break;
                case '<':
                    if (nc == '=') {
                        i++;
                        addToken(TokenType.LessThanEquals, "<=");
                    }
                    else addToken(TokenType.LessThan, cc);
                    break;
                case '>':
                    if (nc == '=') {
                        i++;
                        addToken(TokenType.GreaterThanEquals, ">=");
                    }
                    addToken(TokenType.GreaterThan, cc);
                    break;
                case '&':
                    if (nc == '&') {
                        i++;
                        addToken(TokenType.LogicalAnd, "<=");
                    }
                    else addToken(TokenType.AritmeticAnd, cc);
                case '|':
                    if (nc == '|') {
                        i++;
                        addToken(TokenType.LogicalOr, "<=");
                    }
                    else addToken(TokenType.AritmeticOr, cc);
                    break;
                case ';':
                    addToken(TokenType.SemiColon, cc);
                    break;
                case '"':
                    ct += cc;
                    cc = getChar(++i); // Eat the current character
                    readWhile(c => c != '"');
                    ct += cc;
                    i++;
                    addToken(TokenType.String);
                    break;

                default:
                    if (isNum(cc)) readNumber();
                    else ct += cc;
                    break;
            }
        }

        return tokens;
    },
    Parse: function(tokenStream: Token[]): AST {
        let root: AST = new AST();
        let cst: Token[] = [];

        function addNode(node: ASTNode) {
            root.AddNode(node);
            cst = [];
            let nxt = getToken(i + 1);
            if (nxt != null && nxt.Type == TokenType.SemiColon) {
                nextToken(); // Eat ';'
            }
        }

        let i: number = 0;
        function getToken(index: number = i) { return tokenStream[index] ?? null; }
        function nextToken() {
            let t = getToken(i++);
            while(t != null && t.Type == TokenType.Comment) t = getToken(i++);
            // if (t == null) debugger
            return t;
        }
        function readWhile(endTokenType: TokenType, skip: TokenType[] = null): Token[] {
            let ct = nextToken();
            let cst: Token[] = [];
            while(ct != null && ct.Type != endTokenType) {
                if (skip == null || !skip.find(t => t == ct.Type)) cst.push(ct);
                ct = nextToken();
            }
            return cst;
        }

        let ct = nextToken();
        while(ct != null) {
            switch(ct.Type) {
                case TokenType.LCurlyBracket: // Read block
                    let blockNode = new ASTNode(NodeType.Block);
                    let depth = 1;
                    let elements: Token[] = [];
                    let e = nextToken();
                    while(e != null) {
                        if (e.Type == TokenType.LCurlyBracket) depth++;
                        else if (e.Type == TokenType.RCurlyBracket) {
                            depth--;
                            if (depth == 0) break; // Don't include the ending curly bracket.
                        }
                        elements.push(e);
                        e = nextToken();
                    }
                    blockNode.AddNodes(
                        this.Parse(elements).Children
                    );
                    addNode(blockNode);
                    break;
                case TokenType.Return:
                    let returnNode = new ASTNode<Token[]>(NodeType.Return);

                    let expression: Token[] = readWhile(TokenType.SemiColon);
                    returnNode.AddNode(new ASTNode<Token[]>(NodeType.Expression, expression));

                    addNode(returnNode);
                    break;
                case TokenType.Function:
                    let functionName = nextToken().Value; // get function name
                    nextToken(); // Eat the first '('
                    let functionParameters: Token[] = readWhile(TokenType.RParenthasis, [ TokenType.Comma ]);
                    let functionCodeBlock = root.GetPreviousNode();
                    if (!functionCodeBlock || functionCodeBlock.Type != NodeType.Block) { this.Errors.Expected("code block before function declaration."); break; }
                    root.RemovePreviousNode();
                    
                    let functionNode = new ASTNode<Token[]>(NodeType.Function);
                    functionNode.AddNode(new ASTNode<string>(NodeType.FunctionName, functionName));
                    functionNode.AddNode(new ASTNode<Token[]>(NodeType.FunctionParameters, functionParameters));
                    functionNode.AddNode(new ASTNode<ASTNode<unknown>>(NodeType.CodeBlock, null, functionCodeBlock.Children));

                    addNode(functionNode);
                    break;
                case TokenType.For:
                    nextToken(); // Eat the first '('
                    let forParameters: Token[] = readWhile(TokenType.RParenthasis);
                    let forCodeBlock = root.GetPreviousNode();
                    if (!forCodeBlock || forCodeBlock.Type != NodeType.Block) { this.Errors.Expected("code block before for loop."); break; }
                    root.RemovePreviousNode();
                    
                    let forNode = new ASTNode<Token[]>(NodeType.For);
                    forNode.AddNode(new ASTNode<Token[]>(NodeType.ForParameters, forParameters));
                    forNode.AddNode(new ASTNode<ASTNode<unknown>>(NodeType.CodeBlock, null, forCodeBlock.Children));

                    addNode(forNode);
                    break;
                case TokenType.If:
                case TokenType.Else:

                    let elseNext = getToken(i + 1);
                    if (ct.Type == TokenType.Else && elseNext.Type == TokenType.If) {
                        nextToken(); // Eat If
                    }
                    if (ct.Type == TokenType.If) {

                    }
                    else if (ct.Type == TokenType.Else) {

                    }
                    break;
                case TokenType.If:
                    nextToken(); // Eat the first '('
                    let condition: Token[] = readWhile(TokenType.RParenthasis);
                    let ifCodeBlock = root.GetPreviousNode();
                    if (ifCodeBlock.Type != NodeType.Block) { this.Errors.Expected("code block before if statement."); break; }
                    root.RemovePreviousNode();
                    
                    let ifNode = new ASTNode(NodeType.If);
                    ifNode.AddNode(new ASTNode<Token[]>(NodeType.IfCondition, condition));
                    ifNode.AddNode(new ASTNode<ASTNode<unknown>>(NodeType.CodeBlock, null, ifCodeBlock.Children));

                    addNode(ifNode);
                    break;
                case TokenType.PlusEquals:
                case TokenType.MinusEquals:
                case TokenType.TimesEquals:
                case TokenType.DivideEquals:
                case TokenType.ModulusEquals:
                case TokenType.Assignment:
                    let assignee = nextToken();
                    let AssignmentNode = new ASTNode(NodeType.AssignmentExpression, ct);
                    AssignmentNode.AddNode(new ASTNode<string>(NodeType.Assignee, assignee.Value));
                    AssignmentNode.AddNode(new ASTNode<Token[]>(NodeType.Expression, cst));

                    addNode(AssignmentNode);
                    break;
                /*/ Infix expressions
                case TokenType.LessThan:
                case TokenType.LessThanEquals:
                case TokenType.GreaterThan:
                case TokenType.GreaterThanEquals:
                case TokenType.DivideEquals:
                case TokenType.Addition:
                case TokenType.Subtraction:
                case TokenType.Division:
                case TokenType.Multiplication:
                case TokenType.Modulus:
                case TokenType.LogicalAnd:
                case TokenType.LogicalOr:
                case TokenType.AritmeticAnd:
                case TokenType.AritmeticOr:
                    let lhsExpr = cst;
                    let rhsExpr: Token[] = readWhile(TokenType.SemiColon);
                    let exprNode = new ASTNode(NodeType.InfixExpression, ct, [
                        lhsExpr.length > 1 ? new ASTNode(NodeType.Expression, null, Yoda.Parse(lhsExpr).Children) :  new ASTNode(NodeType.Expression, lhsExpr),
                        rhsExpr.length > 1 ? new ASTNode(NodeType.Expression, null, Yoda.Parse(rhsExpr).Children) :  new ASTNode(NodeType.Expression, rhsExpr)
                    ]);
                    addNode(exprNode);
                    break;
                    */
                // Postfix/Prefix
                case TokenType.Decrement:
                case TokenType.Increment:
                case TokenType.LogicalNot:
                    let incDecNode = new ASTNode(NodeType.Expression);
                    if (cst.length > 0)
                        incDecNode.AddNode(new ASTNode<Token[]>(NodeType.Expression, [ct, cst[0]]));
                    else {
                        let IncDecAssignee = nextToken();
                        incDecNode.AddNode(new ASTNode<Token[]>(NodeType.Expression, [IncDecAssignee, ct]));
                    }
                    addNode(incDecNode);
                    break;
                default:
                    if (ct.Type == TokenType.SemiColon) {
                        if (cst.length > 0) {
                            // Parse Instruction
                            let instruction = new ASTNode(NodeType.Instruction);
                            let path: Token [] = []
                            let args: Token [] = []
                            let depth = 0;
                            for (let j = cst.length - 1; j > 0; j--) {
                                let t = cst[j];

                                if (t.Type == TokenType.RParenthasis) {
                                    if (depth > 0) args.push(new Token(TokenType.LParenthasis, "("));
                                    depth++;
                                }
                                else if (t.Type == TokenType.LParenthasis) {
                                    depth--;
                                    if (depth == 0) break;
                                    else args.push(new Token(TokenType.RParenthasis, ")"));
                                }
                                else if (depth == 0) path.push(t);
                                else args.push(t);
                            }
                            instruction.AddNode(new ASTNode<Token[]>(NodeType.InstructionName, path));
                            instruction.AddNode(new ASTNode<Token[]>(NodeType.InstructionArguments, args));
                            addNode(instruction);
                        }
                    }
                    else cst.push(ct);
                    break;
            }
            ct = nextToken();
        }

        return root;
    },
    Generators: {
        _indent: "  ",
        _tokensToString: function(expr: Token[], space: boolean = true): string {
            let result = "";
            if (expr) {
                for (let i = 0; i < expr.length; i++) {
                    result += expr[i].Value;
                    if (space && i < expr.length - 1) result += " ";
                }
            }
            return result;
        },
        toJS: function(ast: ASTNode, indentPrefix: string = ""): string {
            if (ast == null) return "NULL";
            let indented = indentPrefix + Yoda.Generators._indent;

            let result: string = "";
            function add(code: string, newline: boolean = false, semiColon: boolean = false, indent: boolean = true): void {
                result += (indent? indentPrefix : '') + code + (semiColon? ';' : '') + (newline? '\n' : '');
            }

            for (let  i = ast.Children.length - 1; i >= 0; i--) {
                const b = ast.Children[i];
                switch(b.Type) {
                    case NodeType.Function:
                        let name = b.GetType(NodeType.FunctionName);
                        add("function " + name.Value + "(");
                        let params = b.GetType(NodeType.FunctionParameters).Value as Token[];
                        for (let j = 0; j < params.length; j++) {
                            add(params[j].Value);
                            if (j < params.length - 1) add(", ");
                        }
                        add(") {", true);
                        add(Yoda.Generators.toJS(b.GetType(NodeType.CodeBlock), indented));
                        add("}", true);
                        break;
                    case NodeType.For:
                        add("for (");
                        let forParams = b.GetType(NodeType.ForParameters).Value as Token[];
                        let forParsedParams = Yoda.Parse(forParams);
                        let forJSParams = Yoda.Generators.toJS(forParsedParams).replace(/\n/g,"");
                        add(forJSParams.slice(0,forJSParams.length - 1));
                        add(") {", true);
                        add(Yoda.Generators.toJS(b.GetType(NodeType.CodeBlock), indented));
                        add("}", true);
                        break;
                    case NodeType.AssignmentExpression:
                        let assignee = b.GetType(NodeType.Assignee).Value;
                        let assignmentExpr = b.GetType(NodeType.Expression);
                        let operator = b.Value as Token;
                        if (operator.Type == TokenType.Assignment && !result.includes("let " + assignee)) 
                            add("let " + assignee + " = " + Yoda.Generators._tokensToString(assignmentExpr.Value as Token[]), true, true);
                        else
                            add(assignee + " " + operator.Value + " " + Yoda.Generators._tokensToString(assignmentExpr.Value as Token[]), true, true);
                        break;
                    case NodeType.Return:
                        let returnExpr = b.GetType(NodeType.Expression);
                        add("return " + Yoda.Generators._tokensToString(returnExpr.Value as Token[]), true, true);
                        break;
                    case NodeType.Instruction:
                        let instName = b.GetType(NodeType.InstructionName);
                        let instArgs = b.GetType(NodeType.InstructionArguments) as ASTNode<Token[]>;
                        add( Yoda.Generators._tokensToString(instName.Value as Token[], false) + "(" + Yoda.Generators._tokensToString(instArgs.Value, false) + ")", true, true);
                        break;
                    case NodeType.If:
                        let IfCondition = b.GetType(NodeType.IfCondition);
                        add("if (" + Yoda.Generators._tokensToString(IfCondition.Value as Token[]) + ") {", true);
                        add(Yoda.Generators.toJS(b.GetType(NodeType.CodeBlock), indented));
                        add("}", true);
                        break;
                    case NodeType.Expression:
                        let Eexpr = b.Value as Token[];
                        if (!Eexpr && b.Children.length > 0) {
                            add(Yoda.Generators.toJS(b));
                        }
                        else add(Yoda.Generators._tokensToString(Eexpr, true), true, true);
                        break;
                    case NodeType.InfixExpression:
                        let IexprLhs = b.Children[0].Value as Token[];
                        let IexprRhs = b.Children[1].Value as Token[];
                        let Iexpr = (b.Value as Token).Value;
                        add(Yoda.Generators._tokensToString(IexprLhs) + ' ' + Iexpr + ' ' + Yoda.Generators._tokensToString(IexprRhs), true, true);
                        break;
                }
            }

            return result;
        }
    },
    Errors: {
        _prefix: "An error Yoda throws: ",
        Expected: function(message: string) {
            console.error(this._prefix + "Expected " + message);
        }
    }
}