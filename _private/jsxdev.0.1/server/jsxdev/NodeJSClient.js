
include('node/net.js');
include('Jsx/Util.js');

define(function() {
    var Stream = node.net.Stream;
    var NO_FRAME = -1;

    /**
     * @class jsxdev.NodeJSClient.private$protocol
     * @extends Object
     * @createTime 2012-03-08
     * @updateTime 2012-03-08
     * @author www.mooogame.com, simplicity is our pursuit
     * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
     * @version 1.0
     */

    // Parser/Serializer for V8 debugger protocol
    // http://code.google.com/p/v8/wiki/DebuggerProtocol

    var private$protocol =

    Class('private$protocol', null, {

        private$protocol: function() {
            this._newRes();
        },

        _newRes: function(raw) {

            this.res = { raw: raw || '', headers: {} };
            this.state = 'headers';
            this.reqSeq = 1;
            this.execute('');
        },

        execute: function(d) {
            var res = this.res;
            res.raw += d;
            
            //console.log('KKK******', this.reqSeq);

            switch (this.state) {
                case 'headers':
                    var endHeaderIndex = res.raw.indexOf('\r\n\r\n');

                    if (endHeaderIndex < 0) break;

                    var rawHeader = res.raw.slice(0, endHeaderIndex);
                    var endHeaderByteIndex = Buffer.byteLength(rawHeader, 'utf8');
                    var lines = rawHeader.split('\r\n');
                    for (var i = 0; i < lines.length; i++) {
                        var kv = lines[i].split(/: +/);
                        res.headers[kv[0]] = kv[1];
                    }

                    this.contentLength = +res.headers['Content-Length'];
                    this.bodyStartByteIndex = endHeaderByteIndex + 4;

                    this.state = 'body';

                    if (Buffer.byteLength(res.raw, 'utf8') - this.bodyStartByteIndex < this.contentLength) {
                        break;
                    }
                    // pass thru
                case 'body':
                    var resRawByteLength = Buffer.byteLength(res.raw, 'utf8');

                    if (resRawByteLength - this.bodyStartByteIndex >= this.contentLength) {
                        var buf = new Buffer(resRawByteLength);
                        buf.write(res.raw, 0, resRawByteLength, 'utf8');
                        res.body =
                            buf.slice(this.bodyStartByteIndex,
                                    this.bodyStartByteIndex + this.contentLength).toString('utf8');
                        // JSON parse body?
                        res.body = res.body.length ? JSON.parse(res.body) : {};

                        // Done!
                        this.onResponse(res);

                        this._newRes(buf.slice(this.bodyStartByteIndex
                               + this.contentLength).toString('utf8'));
                    }
                    break;

                default:
                    throw new Error('Unknown state');
                    break;
            }
        },

        serialize: function(req) {
            req.type = 'request';
            req.seq = this.reqSeq++;
            var json = JSON.stringify(req);
            return 'Content-Length: ' + Buffer.byteLength(json, 'utf8') + '\r\n\r\n'
                + json;
        }

    });


    /**
     * @class jsxdev.NodeJSClient
     * @extends node.net.Stream
     * @createTime 2012-03-08
     * @updateTime 2012-03-08
     * @author www.mooogame.com, simplicity is our pursuit
     * @copyright (C) Copyright mooogame Corporation 2011-2100 All Rights Reserved.
     * @version 1.0
     */

    function onResponse(_this, res) {
        var cb, index = -1;

        _this._callbacks.some(function(fn, i) {
            if (fn.request_seq == res.body.request_seq) {
                cb = fn;
                index = i;
                return true;
            }
        });

        var handled = false;

        if (res.headers.Type == 'connect') {
            // Request a list of scripts for our own storage.
            setExceptionBreak(_this);

            _this.emit('ready');
            handled = true;

        }
        else if (res.body) {

            var event = res.body.event;

            switch (res.body.event) {
                case 'break':
                    _this.currentFrame = 0;
                    _this.emit('break', res.body);
                    handled = true;
                    break;
                case 'exception':
                    //_this.emit('errorbreak', res.body);
                    handled = true;
                    break;
                case 'afterCompile':
                    //this._addHandle(res.body.body.script);
                    handled = true;
                    break;
                case 'scriptCollected':
                    // ???
                    //this._removeScript(res.body.body.script);
                    handled = true;
                    break;
            }
        }


        if (cb) {
            _this._callbacks.splice(index, 1);
            handled = true;

            var err = res.success === false && (res.message || true) ||
                    res.body.success === false && (res.body.message || true);
            cb(err, res.body && res.body.body || res.body, res);
        }

        if (!handled) _this.emit('unhandledResponse', res.body);
    }

    // client.next(1, cb);
    function step(_this, action, count, cb) {
        var req = {
            command: 'continue',
            arguments: { stepaction: action, stepcount: count }
        };

        _this.currentFrame = NO_FRAME;
        request(_this, req, cb);
    }

    function request(_this, req, cb) {
        cb = cb || function() { }
        _this.write(_this._protocol.serialize(req));
        cb.request_seq = req.seq;
        _this._callbacks.push(cb);
    }

    function setExceptionBreak(_this) {
        /*
        {"seq":117,"type":"request","command":"setexceptionbreak","arguments":{"type":"all"}}
        {"seq":118,"type":"request","command":" setexceptionbreak","arguments":{"type":"all",”enabled”:false}}
        {"seq":119,"type":"request","command":" setexceptionbreak","arguments":{"type":"uncaught","enabled":true}}
        */
        request(_this, { 
            command: 'setexceptionbreak', 
            arguments: { type: 'uncaught', enabled: true} 
        });
    }

    function clearBreakpoints(_this, name, lines, cb) {

        cb = cb || function() { };
        var arg = { type: 'script', breakpoint: 0 }
        var req = {
            command: 'clearbreakpoint',
            arguments: arg
        };

        var breakpoints = _this._breakpoints;
        var index = breakpoints.length;

        function handler(err, res) {
            if (err)
                return cb(err);
            if (res)
                breakpoints.splice(index, 1);

            index--;

            for (; index > -1; index--) {
                var point = breakpoints[index];
                //{ type: 'scriptName', breakpoint: 6, script_name: 'node.js', line: 45 }

                if ((point.script_name == name && 
                    lines.indexOf(point.line) !== -1) || name === null) {
                    arg.breakpoint = point.breakpoint;
                    return request(_this, req, handler);
                }
            }
            cb();
        }
        handler();
    }

    function Eval(_this, expression, frame, maxStringLength, disable_break, cb) {

        var arguments = { expression: expression, disable_break: disable_break };
        var req = {
            command: 'evaluate',
            arguments: arguments
        };

        if (maxStringLength)
            arguments.maxStringLength = maxStringLength;

        if (frame == NO_FRAME) {
            req.arguments.global = true;
        }
        else {
            req.arguments.frame = frame;
        }
        request(_this, req, cb || function() { });
    }

    Class('jsxdev.NodeJSClient', Stream, {

        //private:
        _protocol: null,
        _callbacks: null,
        _breakpoints: null,

        //public:
        currentFrame: NO_FRAME,


        NodeJSClient: function() {
            Stream.call(this);

            var protocol =
            this._protocol = new private$protocol(this);
            this._callbacks = [];
            this._breakpoints = [];

            // Note that 'Protocol' requires strings instead of Buffers.
            this.setEncoding('utf8');
            this.on('data', function(d) {
                protocol.execute(d);
            });

            protocol.onResponse = onResponse.bind(null, this)
        },

        // This is like reqEval, except it will look up the expression in each of the
        // scopes associated with the current frame.
        eval: function(expression, cb) {
            Eval(this, expression, this.currentFrame, 0, false, cb);
        },

        watch: function(expression, cb) {
            Eval(this, expression, this.currentFrame, 1e8, true, cb);
        },

        listBreakpoints: function(cb) {
            request(this, { command: 'listbreakpoints' }, cb);
        },

        setBreakpoints: function(name, lines, cb) {

            cb = cb || function() { };
            var _this = this;
            var arg = { type: 'script', target: name, line: 0 }
            var req = {
                command: 'setbreakpoint',
                arguments: arg
            };

            function handler(err, res) {
                if (err)
                    return cb(err);

                if (res)
                    _this._breakpoints.push(res);

                if (!lines.length)
                    return cb();

                arg.line = lines.shift();
                request(_this, req, handler);
            }
            handler();
        },

        clearBreakpoints: function(name, lines, cb) {
            clearBreakpoints(this, name, lines, cb);
        },

        clearAllBreakpoints: function(cb) {
            clearBreakpoints(this, null, null, cb);
        },

        //TODO
        //suspend
        //pause
        cont: function(cb) {
            this.currentFrame = NO_FRAME;
            request(this, { command: 'continue' }, cb);
        },

        next: function(cb) {
            step(this, 'next', 1, cb);
        },

        step: function(cb) {
            step(this, 'in', 1, cb);
        },

        out: function(cb) {
            step(this, 'out', 1, cb);
        },

        exit: function() {
            Eval(this, 'process.exit(1);', NO_FRAME, 0, true);
        },
        
        updateCodeVersion:function(){
            
            Eval(this, 'Jsx._Debug.updateCodeVersion();', NO_FRAME, 0, true);
        }
        
    });
});