(function() {
    Object.prototype.$ = function(x) {
        var that = this == window ? document : this
        return Array.prototype.slice.call(that.querySelectorAll(x), 0)
    }
    var isFireFox = (function() {
        if (navigator.userAgent.toLowerCase().indexOf("firefox") < 0) return false
        return true
    })()

    function addEvent(event, callback, tar) {
        var obj = tar ? tar : window
        if (event == "mousewheel" || event == "DOMMouseScroll") {
            if (isFireFox) event = "DOMMouseScroll"
        }
        if (window.addEventListener)
            obj.addEventListener(event, callback)
        else if (window.attachEvent)
            obj.attachEvent("on" + event, callback)
        else obj["on" + event] = callback
    }

    function removeEvent(event, callback, tar) {
        var obj = tar ? tar : window
        if (event == "mousewheel" || event == "DOMMouseScroll") {
            if (isFireFox) event = "DOMMouseScroll"
        }
        if (window.removeEventListener)
            obj.removeEventListener(event, callback)
        else if (window.detachEvent)
            obj.detachEvent("on" + event, callback)
        else obj["on" + event] = null
    }
    var t = null
    var Croppy = (function() {

        function Croppy(item) {
            var that = this

            this.father = item.parentElement
            this.stack = [
                [],
                []
            ]
            this.ntstack = []
            this.lock = false
            this.op = 0
            this.drag = false
            this.delta = 1
            this.angle = 0
            this.isblock = false
            this.setting = Object.prototype.Croppy.Default
            this.bshow = false //block show
            this.ele = item
            this.image = new Image()
            this.image.src = item.src
            this.step = this.setting.step

            this.width = this.setting.width
            this.height = this.setting.height
            this.degree = this.setting.degree

            addEvent("load", function() {
                that.init()
            }, this.image)
        }

        Croppy.prototype = {
            init: function() {
                console.log("init")
                this.wrapper = this.father.$(this.setting.selector.wrapper)[0]

                this.canvas = this.father.$(this.setting.selector.canvas)[0]

                //canvas-cover 
                this.floor = this.father.$(this.setting.selector.floor)[0]

                this.layer = this.father.$(this.setting.selector.layer)[0]

                this.canvas.width = this.floor.width = this.width
                this.canvas.height = this.floor.height = this.height

                //selector
                this.clip = this.father.$(this.setting.selector.clip)[0]

                this.earase = this.father.$(this.setting.selector.earase)[0]

                this.match = this.father.$(this.setting.selector.wordmatch)[0]

                this.clock = this.father.$(this.setting.selector.clock)[0]

                this.unclock = this.father.$(this.setting.selector.unclock)[0]

                this.deg = this.father.$(this.setting.selector.deg)[0]

                this.preStep = this.father.$(this.setting.selector.preStep)[0]

                this.nextStep = this.father.$(this.setting.selector.nextStep)[0]

                this.reset = this.father.$(this.setting.selector.reset)[0]

                this.close = this.father.$(this.setting.selector.close)[0]

                this.btn = this.father.$(this.setting.selector.btn)

                //init style
                var rulerSize = this.setting.rulerSize,
                    lineweight = this.setting.lineweight

                this.block = this.father.$(this.setting.selector.block)[0]
                this.innblocks = this.block.$(this.setting.selector.innblock)
                console.log(this.block, this.innblocks)
                this.block.style.width = this.block.style.heigh = rulerSize + lineweight * 2 + "px"

                this.innblocks.forEach(function(item) {
                    item.style.borderWidth = lineweight + "px"
                    item.style.width = item.style.height = (rulerSize - lineweight) / 2 + "px"
                })

                this.wrapper.style.cssText = "width:" + this.width + "px;height:" + (this.height + 50) + "px;margin-left:" + (-this.width / 2) + "px; margin-top:" + (-(this.height + 50) / 2) + "px;"

                this.layer.style.cssText = "width:" + this.width + "px;height:" + this.height + "px;"


                this._initcanvas()
                this._initEvent()
            },

            _clip: function() {
                this._pushState(false)
                this.stack[1].length = 0

                var inncan = this.inncan,
                    innctx = this.innctx

                inncan.width = this.nowx - this.prex
                inncan.height = this.nowy - this.prey

                innctx.drawImage(this.canvas, this.prex, this.prey, inncan.width, inncan.height, 0, 0, inncan.width, inncan.height)

                this.angle = 0, this.delta = 1

                this.image = new Image()
                this.image.src = inncan.toDataURL("image/png")

                this.initx = (this.width - this.image.width) / 2
                this.inity = (this.height - this.image.height) / 2


                var that = this
                setTimeout(function() {
                    that.ctx.clearRect(0, 0, that.width, that.height)
                    that.ctx.drawImage(that.image, that.initx, that.inity, that.image.width, that.image.height)
                }, 400)


            },

            _save: function() {
                var obj = {
                    x: this.initx,
                    y: this.inity,
                    delta: this.delta,
                    angle: this.angle,
                    image: this.image
                }
                console.log(obj)
                return {
                    x: this.initx,
                    y: this.inity,
                    delta: this.delta,
                    angle: this.angle,
                    image: this.image
                }
            },

            _earase: function() {
                this._pushState(false)
                this.stack[1].length = 0

                var p1 = this._tmpMatrix(this.prex, this.prey),
                    p2 = this._tmpMatrix(this.nowx, this.prey),
                    p3 = this._tmpMatrix(this.nowx, this.nowy),
                    p4 = this._tmpMatrix(this.prex, this.nowy),
                    innctx = this.innctx,
                    inncan = this.inncan

                innctx.save()
                innctx.beginPath()

                innctx.moveTo(p1.x - this.initx, p1.y - this.inity)
                innctx.lineTo(p2.x - this.initx, p2.y - this.inity)
                innctx.lineTo(p3.x - this.initx, p3.y - this.inity)
                innctx.lineTo(p4.x - this.initx, p4.y - this.inity)
                innctx.lineTo(p1.x - this.initx, p1.y - this.inity)
                innctx.closePath()
                innctx.clip()
                innctx.fillStyle = "#fff"
                innctx.fillRect(0, 0, this.inncan.width, this.inncan.height)
                innctx.restore()

                this.image = new Image()
                this.image.src = inncan.toDataURL("image/png")

                this._draw()
            },

            _tmpMatrix: function(xx, yy) {
                var cosd = Math.cos(-this.angle),
                    sind = Math.sin(-this.angle),
                    ix = this.width / 2,
                    iy = this.height / 2
                xx = (xx - ix) / this.delta + ix
                yy = (yy - iy) / this.delta + iy
                return {
                    x: (xx - ix) * cosd - sind * (yy - iy) + ix,
                    y: sind * (xx - ix) + cosd * (yy - iy) + iy
                }
            },
            _rotMarix: function(deg) {
                var x = this.initx,
                    y = this.inity,
                    cosd = Math.cos(deg),
                    sind = Math.sin(deg)
                this.initx = x * cosd - sind * y
                this.inity = sind * x + cosd * y
            },
            _draw: function() {
                var ctx = this.ctx
                ctx.save()
                ctx.clearRect(0, 0, this.width, this.height)
                ctx.translate(this.width / 2, this.height / 2)

                ctx.scale(this.delta, this.delta)
                ctx.rotate(this.angle)
                ctx.translate(-this.width / 2, -this.height / 2)

                ctx.drawImage(this.image, this.initx, this.inity, this.image.width, this.image.height)
                ctx.restore()
            },
            _clock: function(op) {
                this._pushState(false)
                this.stack[1].length = 0

                var ctx = this.ctx

                this.angle += Math.PI * this.degree / 180 * (op ? 1 : -1)

                this._draw()

                $("#test")[0].src = this.canvas.toDataURL("image/png")
            },

            _match: function() {
                this.bshow = !this.bshow
                console.log(this.bshow)
                if (this.bshow) this.block.style.display = "block", this.match.style.cssText = this.setting.style.active
                else this.block.style.display = "none", this.match.style.cssText = ""
            },

            _popState: function(flag) {
                flag = flag ? 1 : 0
                if (!this.stack[flag].length) return
                return this.stack[flag].pop()
            },

            _pushState: function(flag, obj) {
                flag = flag ? 1 : 0
                var tar = obj ? obj : this._save()
                if (this.stack[flag].length >= this.step) this.stack[flag].shift()
                this.stack[flag].push(tar)
            },

            _step: function(flag) {
                flag = flag ? 1 : 0

                this._pushState(!flag)
                console.log(this.stack[flag])
                var tar = this._popState(flag)
                if (!tar) return
                console.log(tar)

                this.image = tar.image
                this.initx = tar.x
                this.inity = tar.y
                this.angle = tar.angle
                this.delta = tar.delta

                this.inncan.width = this.image.width, this.inncan.height = this.image.height
                this.innctx.drawImage(this.image, 0, 0, this.image.width, this.image.height)

                this._draw()
            },
            _reset: function() {
                this.image.src = this.ele.src
                console.log(this.ele.src)
                this.initx = this.originx, this.inity = this.originy

                this._initInn()

                this.ctx.clearRect(0, 0, this.width, this.height)
                this.ctx.drawImage(this.image, this.initx, this.inity, this.image.width, this.image.height)
                this.stack = [
                    [],
                    []
                ]
                console.log("function")
            },

            _resize: function() {
                var base = this.getOffset(this.layer)

                this.baseX = base.x
                this.baseY = base.y
            },

            _close: function() {
                //remember to remove the event
                var tmpcan = document.createElement("canvas"),
                    tmpctx = tmpcan.getContext("2d"),
                    canvas = this.inncan,
                    ctx = this.innctx,
                    width = canvas.width * this.delta,
                    height = canvas.height * this.delta,
                    image = new Image()

                tmpcan.width = width
                tmpcan.height = height
                tmpctx.save()
                tmpctx.clearRect(0, 0, width, height)
                tmpctx.translate(width / 2, height / 2)

                tmpctx.rotate(this.angle)
                tmpctx.translate(-width / 2, -height / 2)

                image.src = canvas.toDataURL("image/png")
                tmpctx.drawImage(image, 0, 0, this.image.width, this.image.height, 0, 0, width, height)
                tmpctx.restore()

                $("#test")[0].src = tmpcan.toDataURL("image/png")

            },

            _mouseDown: function(e) {
                e = e || window.event
                clearTimeout(t)
                this.ctx2.clearRect(0, 0, this.width, this.height)
                var x = e.clientX || e.pageX,
                    y = e.clientY || e.clientY

                if (e.target.className == this.block.className || e.target.className == this.innblocks[0].className) {
                    this.prex = x - this.block.offsetLeft - this.baseX
                    this.prey = y - this.block.offsetTop - this.baseY
                    this.isblock = true
                } else {
                    if (x < this.baseX || x > this.baseX + this.width || y < this.baseY || y > this.baseY + this.height) return
                    console.log("down")
                    this.prex = x - this.baseX
                    this.prey = y - this.baseY
                }

                this.drag = true
                this.lock = false
            },


            _mouseMove: function(e) {

                if (!this.drag) return
                this.lock = true
                e = e || window.event

                var x = (e.clientX || e.pageX) - this.baseX,
                    y = (e.clientY || e.pageY) - this.baseY

                if (this.isblock) {
                    this.block.style.top = (y - this.prey) + "px"
                    this.block.style.left = (x - this.prex) + "px"
                    return
                }

                // console.log(x, y)
                this.nowx = x <= 0 ? 0 : (x >= this.width ? this.width : x)
                this.nowy = y <= 0 ? 0 : (y >= this.height ? this.height : y)

                this.drawrect()
            },

            _mouseUp: function(e) {

                if (!this.drag || !this.lock) {
                    this.drag = this.lock = this.isblock = false
                    return
                }

                console.log("up")
                this.drag = this.lock = this.isblock = false

                if (this.op > 0) {
                    // clip is 1
                    console.log("clip")
                    this._clip()

                } else if (this.op < 0) {
                    // earase is -1 
                    console.log("earase")
                    this._earase()
                }
                t = setTimeout(this._clearrect.bind(this), 300)
            },

            _clearrect: function() {
                this.ctx2.clearRect(0, 0, this.width, this.height)
            },

            _mouseScroll: function(e) {
                // this._pushState(false)

                e = e || window.event
                var delta = e.detail || -e.wheelDelta

                this.delta += delta / this.setting.speed
                if (this.delta <= 0.1) this.delta = 0.1
                var that = this
                setTimeout(function() {
                    that._draw()
                }, 0)
                console.log(this.delta)
                e.preventDefault() || (e.returnValue = false)
                return false
            },

            drawrect: function() {
                this.ctx2.clearRect(0, 0, this.width, this.height)
                this.ctx2.strokeStyle = "#39f"

                this.ctx2.strokeRect(this.prex, this.prey, this.nowx - this.prex, this.nowy - this.prey)
            },

            _getScale: function() {
                var ratio = this.width / this.height,
                    img_ratio = this.image.width / this.image.height,
                    initx = 0,
                    inity = 0

                console.log(this.image.width)
                if (img_ratio > ratio) {
                    initx = 0
                    inity = (this.height - this.width / img_ratio) / 2
                    this.image.width = this.width
                    this.image.height = this.height - inity * 2
                } else {
                    inity = 0
                    initx = (this.width - this.height * img_ratio) / 2
                    this.image.width = this.width - initx * 2
                    this.image.height = this.height
                }

                return { x: initx, y: inity }
            },
            getOffset: function(tar) {
                var obj = tar,
                    x = 0,
                    y = 0
                while (obj) {
                    x += obj.offsetLeft
                    y += obj.offsetTop
                    obj = obj.offsetParent
                }
                return { x: x, y: y }
            },
            _initInn: function() {
                this.inncan.width = this.image.width, this.inncan.height = this.image.height
                this.innctx.drawImage(this.image, 0, 0, this.image.width, this.image.height)
            },
            _initcanvas: function() {
                var init = this._getScale(),
                    base = this.getOffset(this.layer)

                this.baseX = base.x
                this.baseY = base.y
                this.initx = this.originx = init.x
                this.inity = this.originx = init.y

                this.ctx = this.canvas.getContext('2d')
                this.ctx2 = this.floor.getContext('2d')

                this.ctx.clearRect(0, 0, this.width, this.height)
                this.ctx2.clearRect(0, 0, this.width, this.height)

                this.ctx.drawImage(this.image, this.initx, this.inity, this.image.width, this.image.height)

                this.inncan = document.createElement("canvas")
                this.innctx = this.inncan.getContext("2d")

                this._initInn()

                $("#test")[0].src = this.inncan.toDataURL("image/png")
            },

            _activeBtn: function(obj) {
                var that = this
                this.btn.forEach(function(item) {
                    if (item == that.match) return
                    item.style.cssText = ""
                })
                obj.style.cssText = this.setting.style.active
            },

            _initEvent: function() {
                var that = this
                addEvent("mousedown", function() {
                    that._mouseDown()
                })
                addEvent("mousemove", function() {
                    that._mouseMove()
                })
                addEvent("mouseup", function() {
                    that._mouseUp()
                })
                addEvent("mousewheel", function() {
                    that._mouseScroll()
                }, this.layer)

                addEvent("click", function() {
                    that.op = 1
                    that._activeBtn(that.clip)
                }, this.clip)

                addEvent("click", function() {
                    that.op = -1
                    that._activeBtn(that.earase)
                }, this.earase)

                addEvent("click", function() {
                    that.op = 0
                    that._match()
                }, this.match)

                addEvent("click", function() {
                    that.op = 0
                    that._activeBtn(that.clock)
                    that._clock(true)

                }, this.clock)
                addEvent("click", function() {
                    that.op = 0
                    that._activeBtn(that.unclock)
                    that._clock(false)

                }, this.unclock)
                addEvent("click", function() {
                    that.op = 0
                    that._activeBtn(that.preStep)
                    setTimeout(function() {
                        that.preStep.style.cssText = ""
                    }, 200)
                    that._step(false)

                }, this.preStep)
                addEvent("click", function() {
                    that.op = 0
                    that._activeBtn(that.nextStep)
                    that._step(true)
                    setTimeout(function() {
                        that.nextStep.style.cssText = ""
                    }, 200)

                }, this.nextStep)

                addEvent("click", function() {
                    that.op = 0
                    that._activeBtn(that.reset)
                    that._reset()
                    setTimeout(function() {
                        that.reset.style.cssText = ""
                    }, 200)
                }, this.reset)
                addEvent("click", function() {
                    that.op = 0
                    that._activeBtn(that.close)
                    that._close()

                }, this.close)

                addEvent("change", function() {
                    that.degree = Number(this.value)
                    console.log(that.degree)
                }, this.deg)

                addEvent("resize", function() {
                    that._resize()
                })
            }
        }

        return Croppy
    })()

    Object.prototype.Croppy = function(option) {
        return this.forEach(function(item) {
            var data = item.data

            if (!data) item.data = new Croppy(item)
            else console.log(item)

            return data
        })
    }

    Object.prototype.Croppy.Default = {
        selector: {
            canvas: ".canvas",
            floor: ".canvas-cover",
            layer: ".layer-content",
            cover: ".cover",
            wrapper: ".container",
            clip: ".clip",
            earase: ".earase",
            wordmatch: ".match",
            clock: ".clock",
            unclock: ".unclock",
            deg: ".deg",
            preStep: ".preStep",
            nextStep: ".nextStep",
            reset: ".reset",
            close: ".close",
            block: ".ruler",
            innblock: ".ruler-block",
            btn: ".btn"
        },
        style: {
            active: "background-color: #286090;border-color: #204d74;"
        },
        rulerSize: 12,
        lineweight: 2,
        width: 850,
        height: 515,
        degree: 1,
        step: 5,
        speed: 600 //100-> fast, 1000->slow
    }
})()