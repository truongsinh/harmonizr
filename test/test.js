var modifier = this.modifier || require('../lib/modifier');
var harmonizr = this.harmonizr || require('../lib/harmonizr');

describe('harmonizr', function() {

    it('should say in which pipeline an error happened', function () {
        var src      = 'a';
        var expected = '';
        try {
            harmonize(src, expected, {fail: true});
        } catch (e) {
            e.message.should.equal('Stage `fail` created unparsable code: Line 1: Unexpected token }');
            e.actual.should.equal('a');
            e.expected.should.equal('}a');
        }
    });

    describe('modules, imports, and exports', function() {

        it('turns module declarations into AMD modules', function() {
            var src      = 'module m {}';
            var expected = 'define(function() {});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('works when the module is not empty', function() {
            var src      = 'module m { function a() {} }';
            var expected = 'define(function() { function a() {} });';
            harmonize(src, expected, { style: 'amd' });
        });

        it('works when the module is split across multiple lines', function() {
            var src      = 'module m {\n' +
                           '    function a() {}\n' +
                           '}';
            var expected = 'define(function() {\n' +
                           '    function a() {}\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('does not work with nested modules', function() {
            var src      = 'module m {\n' +
                           '    module a {}\n' +
                           '}';
            var expected = 'define(function() {\n' +
                           '    module a {}\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('converts import declarations into AMD dependencies', function() {
            var src      = 'module m1 {\n' +
                           '    import a from m2;\n' +
                           '}';
            var expected = 'define([\'m2\'], function(m2) {\n' +
                           '    var a = m2.a;\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('supports destructuring imports', function() {
            var src      = 'module m1 {\n' +
                           '    import { a, b } from m2;\n' +
                           '}';
            var expected = 'define([\'m2\'], function(m2) {\n' +
                           '    var a = m2.a, b = m2.b;\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('supports renaming multiple imports', function() {
            var src      = 'module m1 {\n' +
                           '    import { a, b: c.d } from m2;\n' +
                           '}';
            var expected = 'define([\'m2\'], function(m2) {\n' +
                           '    var a = m2.a, b = m2.c.d;\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('skips import * declarations', function() {
            var src      = 'module m1 {\n' +
                           '    import * from m2;\n' +
                           '}';
            var expected = 'define(function() {\n' +
                           '    import * from m2;\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('returns an object containing all the exports', function() {
            var src      = 'module m {\n' +
                           '    export var a;\n' +
                           '    export function b() {}\n' +
                           '}';
            var expected = 'define(function() {\n' +
                           '    var a;\n' +
                           '    function b() {}\n' +
                           '\n' +
                           '    return {\n' +
                           '        a: a,\n' +
                           '        b: b\n' +
                           '    };\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('can transpile to Node.js', function() {
            var src      = 'module m1 {\n' +
                           '    import { a, b: c.d } from m2;\n' +
                           '    export var e;\n' +
                           '    export function f() {}\n' +
                           '}';
            var expected = '\n' +
                           '    var m2 = require(\'m2\'), a = m2.a, b = m2.c.d;\n' +
                           '    var e;\n' +
                           '    function f() {}\n' +
                           '\n' +
                           '    module.exports = {\n' +
                           '        e: e,\n' +
                           '        f: f\n' +
                           '    };\n';
            harmonize(src, expected, { style: 'node' });
        });

        it('allows you to specify which modules are relative', function() {
            var src      = 'module m1 {\n' +
                           '    import a from m2;\n' +
                           '}';
            var expected = '\n' +
                           '    var m2 = require(\'./m2\'), a = m2.a;\n' +
                           '';
            harmonize(src, expected, { style: 'node', relatives: ['m2'] });
        });

        it('can transpile to the revealing module pattern', function() {
            var src      = 'module m1 {\n' +
                           '    import a from m2;\n' +
                           '    import { b, c: d } from m3;\n' +
                           '    export var e;\n' +
                           '    export function f() {}\n' +
                           '}';
            var expected = 'var m1 = function() {\n' +
                           '    var a = m2.a;\n' +
                           '    var b = m3.b, c = m3.d;\n' +
                           '    var e;\n' +
                           '    function f() {}\n' +
                           '\n' +
                           '    return {\n' +
                           '        e: e,\n' +
                           '        f: f\n' +
                           '    };\n' +
                           '}();';
            harmonize(src, expected, { style: 'revealing' });
        });

        it('can detect indentation when the first line in a module is blank', function() {
            var src      = 'module m1 {\n' +
                           '\n' +
                           '    import a from m2;\n' +
                           '    import { b, c: d } from m3;\n' +
                           '    export var e;\n' +
                           '    export function f() {}\n' +
                           '}';
            var expected = 'var m1 = function() {\n' +
                           '\n' +
                           '    var a = m2.a;\n' +
                           '    var b = m3.b, c = m3.d;\n' +
                           '    var e;\n' +
                           '    function f() {}\n' +
                           '\n' +
                           '    return {\n' +
                           '        e: e,\n' +
                           '        f: f\n' +
                           '    };\n' +
                           '}();';
            harmonize(src, expected, { style: 'revealing' });
        });

        it('supports implicit AMD-style modules', function() {
            var src      = 'export function f() {\n' +
                           '    return 42;\n' +
                           '}';
            var expected = 'define(function() {function f() {\n' +
                           '    return 42;\n' +
                           '}\n' +
                           '\n' +
                           'return {\n' +
                           '    f: f\n' +
                           '};\n' +
                           '});';
            harmonize(src, expected, { style: 'amd', module: 'm' });
        });

        it('supports implicit Node.js-style modules', function() {
            var src      = 'export function f() {\n' +
                           '    return 42;\n' +
                           '}';
            var expected = 'function f() {\n' +
                           '    return 42;\n' +
                           '}\n' +
                           '\n' +
                           'module.exports = {\n' +
                           '    f: f\n' +
                           '};\n';
            harmonize(src, expected, { style: 'node', module: 'm' });
        });

        it('supports implicit Revealing Module-style modules', function() {
            var src      = 'export function f() {\n' +
                           '    return 42;\n' +
                           '}';
            var expected = 'var m = function() {function f() {\n' +
                           '    return 42;\n' +
                           '}\n' +
                           '\n' +
                           'return {\n' +
                           '    f: f\n' +
                           '};\n' +
                           '}();';
            harmonize(src, expected, { style: 'revealing', module: 'm' });
        });

        it('allows whole module imports using module x = y with amd', function() {
            var src      = 'module m1 {\n' +
                           '    module m2 = m3;\n' +
                           '}';
            var expected = 'define([\'m3\'], function(m3) {\n' +
                           '    var m2 = m3;\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

        it('allows whole module imports using module x = y with node', function() {
            var src      = 'module m1 {\n' +
                           '    module m2 = m3;\n' +
                           '}';
            var expected = '\n' +
                           '    var m2 = require(\'m3\');\n' +
                           '';
            harmonize(src, expected, { style: 'node' });
        });

        it('allows whole module imports using module x = y with revealing modules', function() {
            var src      = 'module m1 {\n' +
                           '    module m2 = m3;\n' +
                           '}';
            var expected = 'var m1 = function() {\n' +
                           '    var m2 = m3;\n' +
                           '}();';
            harmonize(src, expected, { style: 'revealing' });
        });

        it('allows specifying modules as strings', function() {
            var src      = 'module m1 {\n' +
                           '    module a = \'m2\';\n' +
                           '    import b from \'m3\';\n' +
                           '}';
            var expected = 'define([\'m2\', \'m3\'], function(m2, m3) {\n' +
                           '    var a = m2;\n' +
                           '    var b = m3.b;\n' +
                           '});';
            harmonize(src, expected, { style: 'amd' });
        });

    });

    describe('shorthand properties', function() {

        it('converts shorthand properties into longhand properties', function() {
            var src      = 'var o = {\n' +
                           '    a,\n' +
                           '    b: c,\n' +
                           '    d\n' +
                           '};';
            var expected = 'var o = {\n' +
                           '    a: a,\n' +
                           '    b: c,\n' +
                           '    d: d\n' +
                           '};';
            harmonize(src, expected);
        });

        it('works when the shorthand properties are on the same line', function() {
            var src      = 'var o = { a, b: c, d };';
            var expected = 'var o = { a: a, b: c, d: d };';
            harmonize(src, expected);
        });

    });

    describe('method definitions', function() {

        it('supports method definitions', function() {
            var src      = 'var o = {\n' +
                           '    m() {}\n' +
                           '};';
            var expected = 'var o = {\n' +
                           '    m: function() {}\n' +
                           '};';
            harmonize(src, expected);
        });

        it('supports concise methods', function() {
            var src      = 'var o = {\n' +
                           '    a() 42\n' +
                           '};';
            var expected = 'var o = {\n' +
                           '    a: function() { return 42; }\n' +
                           '};';
            harmonize(src, expected);
        });

        it('does not put return in front of concise assignments (or should it?)', function() {
            var src      = 'var o = {\n' +
                           '    a(b) c = b\n' +
                           '};';
            var expected = 'var o = {\n' +
                           '    a: function(b) { c = b; }\n' +
                           '};';
            harmonize(src, expected);
        });

    });

    describe('arrow functions', function() {

        it('supports arrow functions', function() {
          var src      = 'var f = a => 42;';
          var expected = 'var f = function(a) { return 42; };';
          harmonize(src, expected);
        });

        it('supports arrow functions with no params', function() {
          var src      = 'var f = () => 42;';
          var expected = 'var f = function() { return 42; };';
          harmonize(src, expected);
        });

        it('supports arrow functions with multiple params', function() {
          var src      = 'var f = (a, b) => 42;';
          var expected = 'var f = function(a, b) { return 42; };';
          harmonize(src, expected);
        });

        it('supports arrow functions with one wrapped param', function() {
          var src      = 'var f = (a) => 42;';
          var expected = 'var f = function(a) { return 42; };';
          harmonize(src, expected);
        });

        it('allows curlies around the function body', function() {
          var src      = 'var f = a => { return 42; };';
          var expected = 'var f = function(a) { return 42; };';
          harmonize(src, expected);
        });

        it('works across lines', function() {
          var src      = 'var f = (\na\n)\n=>\n42;';
          var expected = 'var f = function(\na\n\n\n) { return 42; };';
          harmonize(src, expected);
        });

        it('binds to the lexical this if it needs to', function() {
          var src      = 'var f = a => this.b;';
          var expected = 'var f = function(a) { return this.b; }.bind(this);';
          harmonize(src, expected);
        });

        it('allows nested arrow functions', function() {
          var src      = 'var f = a => b => 42;';
          var expected = 'var f = function(a) { return function(b) { return 42; }; };';
          harmonize(src, expected);
        });

    });

    describe('destructuring assignments', function() {

        it('works with arrays', function() {
            var src      = '[a, b] = [c, d];';
            var expected = 'a = [c, d], b = a[1], a = a[0];';
            harmonize(src, expected);
        });

    });

    describe('classes', function() {
        /*jshint multistr:true */

        it('should not be hoisted', runHarmonized('\
            (function () {\n\
                new A();\n\
            }).should.throw();\n\
            class A {}\
        '));

        it('should create an instance', runHarmonized('\
            class A\n\
            {}\n\
            (new A).should.be.an.instanceof(A);\
        '));

        it('should support constructors', runHarmonized('\
            class\n\
            A\n\
            {\n\
                constructor(a) { this.a = a; }\n\
            }\n\
            (new A(10)).a.should.equal(10);\
        '));

        it('should support members', runHarmonized('\
            class A { constructor(a) { this.a = a; }\n\
                getA() { return this.a; } }\n\
            (new A(10)).getA().should.equal(10);\
        '));

        it('should support inheritance', runHarmonized('\
            class A {}\n\
            class B extends A {}\n\
            (new B).should.be.an.instanceof(A);\
        '));

        it('should support inheritance from an expression', runHarmonized('\
            class A {}\n\
            class B extends (false || true &&\n\
                (new A).constructor) {}\n\
            (new B).should.be.an.instanceof(A);\
        '));

        it('should support anonymous class expressions', runHarmonized('\
            class A {}\n\
            var B = (\n\
                ((class extends A {})\n\
                ));\n\
            (new B).should.be.an.instanceof(A);\
        '));

        it('should support anonymous class expressions directly', runHarmonized('\
            (new (class {\n\
                constructor() { this.a = 10; }\n\
            })()).a.should.equal(10);\
        '));

        it('should support calls to super()', runHarmonized('\
            class A {\n\
                constructor() { this.a = 10; }\n\
            }\n\
            var i = 0;\n\
            class B extends (false || ++i &&\n\
                (new A).constructor) {\n\
                constructor() { super(); }\n\
            }\n\
            (new B).a.should.equal(10);\n\
            (new B)\n\
            i.should.equal(1);\
        '));

        it('should support calls to super.method()', runHarmonized('\
            class A {\n\
                constructor() { this.a = 10; }\n\
                getA() { return this.a; }\n\
            }\n\
            var i = 0;\n\
            class B extends (false || ++i &&\n\
                (new A).constructor) {\n\
                constructor() { super(); }\n\
                getA() { return super.getA() + 10; }\n\
            }\n\
            (new B).getA().should.equal(20);\n\
            (new B)\n\
            i.should.equal(1);\
        '));

        it('should support nested classes', runHarmonized('\
            class A {\n\
                constructor() {}\n\
                b() {\n\
                    return class extends A { constructor() { super(); } };\n\
                };\n\
            }\n\
            (new ((new A).b())).should.be.an.instanceof(A);\
        '));

        it('should support nested classes with newlines', runHarmonized('\
            class A {\n\
                constructor() {}\n\
                b() {\n\
                    return class\n\
                        extends A\n\
                        { constructor() { super(); } };\n\
                };\n\
            }\n\
            (new ((new A).b())).should.be.an.instanceof(A);\
        '));

        it('should support getters and setters', runHarmonized('\
            class A {\n\
                get a() { return this._a; }\n\
                set a(a) { this._a = a + 10; }\n\
            }\n\
            var a = new A;\n\
            a.a = 10;\n\
            a.a.should.equal(20);\
        '));

        it('should correctly inherit getters and setters', runHarmonized('\
            class A {\n\
                get a() { return this._a + 10; }\n\
                set a(a) { this._a = a; }\n\
            }\n\
            class B extends A {\n\
                set a(a) { this._a = a + 10; }\n\
            }\n\
            var b = new B;\n\
            b.a = 10;\n\
            b.a.should.equal(30);\
        '));

    });

});

describe('modifier', function () {
    var Modifier = modifier.Modifier;

    it('should provide the finished source on `finish`', function () {
        var expected = 'var a = 10;';
        var m = new Modifier(expected);
        var actual = m.finish();
        actual.should.equal(expected);
    });

    it('should parse the source into an ast', function () {
        var expected = 'var a = 10;';
        var m = new Modifier(expected);
        m.ast.type.should.equal('Program');
    });

    it('should provide `lines` for manual access', function () {
        var expected = 'var a = 10;';
        var m = new Modifier(expected);
        m.lines[0].should.equal(expected);
    });

    it('should support `remove` using two loc objects', function () {
        var src      = 'var a = 10;';
        var expected = 'var a = ;';
        var m = new Modifier(src);
        var literal = m.ast.body[0].declarations[0].init;
        m.remove(literal.loc.start, literal.loc.end);
        var actual = m.finish();
        actual.should.equal(expected);
    });

    it('should support `remove` spanning multiple lines', function () {
        var src      = 'var a = function (a) {\n  return a;\n};';
        var expected = 'var a = \n\n;';
        var m = new Modifier(src);
        var fn = m.ast.body[0].declarations[0].init;
        m.remove(fn.loc.start, fn.loc.end);
        var actual = m.finish();
        actual.should.equal(expected);
    });

    it('should support `remove` using one loc object and an offset', function () {
        var src      = 'var a = 10;';
        var expected = 'var a = ;';
        var m = new Modifier(src);
        var literal = m.ast.body[0].declarations[0].init;
        m.remove(literal.loc.start, 2);
        var actual = m.finish();
        actual.should.equal(expected);
    });

    it('should support `insert`', function () {
        var src      = 'var a = 4;';
        var expected = 'var a = 42;';
        var m = new Modifier(src);
        var literal = m.ast.body[0].declarations[0].init;
        m.insert(literal.loc.end, '2');
        var actual = m.finish();
        actual.should.equal(expected);
    });

    it('should support `replace`', function () {
        var src      = 'var a = 10;';
        var expected = 'var a = 42;';
        var m = new Modifier(src);
        var literal = m.ast.body[0].declarations[0].init;
        m.replace(literal.loc.start, literal.loc.end, '42');
        var actual = m.finish();
        actual.should.equal(expected);
    });

    it('should support `replace` with newlines', function () {
        var src      = 'var a = (\n42\n);';
        var expected = 'var a = 10\n\n;';
        var m = new Modifier(src);
        var expr = m.ast.body[0].declarations[0].init;
        m.replace(expr.loc.start, expr.loc.end, '10');
        var actual = m.finish();
        actual.should.equal(expected);
    });

    it('should support `replace` with an offset', function () {
        var src      = 'var a = 10;';
        var expected = 'var a = 42;';
        var m = new Modifier(src);
        var literal = m.ast.body[0].declarations[0].init;
        m.replace(literal.loc.start, 2, '42');
        var actual = m.finish();
        actual.should.equal(expected);
    });

    it('should support `refresh`', function () {
        var src      = 'var a = 10;';
        var m = new Modifier(src);
        var literal = m.ast.body[0].declarations[0].init;
        m.replace(literal.loc.start, literal.loc.end, '42');
        m.refresh();
        m.ast.body[0].declarations[0].init.value.should.equal(42);
    });
});

function runHarmonized(src, options) {
    /*jshint evil:true */
    var harmonized = harmonizr.harmonize(src, options);
    // maintain line numbers:
    src.split('\n').length.should.equal(harmonized.split('\n').length);
    return new Function(harmonized);
}

function harmonize(src, expected, options) {
    var actual;
    try {
        actual = harmonizr.harmonize(src, options);
    } catch (e) {
        actual = e;
    }
    if (typeof expected === 'string') {
        if (actual instanceof Error) {
            throw actual;
        }
        actual.should.equal(expected);
    } else {
        actual.should.be.an.instanceOf(Error);
        actual.message.should.equal(expected.message);
    }
}
/* vim: set sw=4 ts=4 et tw=80 : */
