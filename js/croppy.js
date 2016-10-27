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

                this.oto = this.father.$(this.setting.selector.oto)[0]

                this.btn = this.father.$(this.setting.selector.btn)

                this.sure = this.father.$(this.setting.selector.sure)[0]

                this.tip = this.father.$(this.setting.selector.tip)[0]
                this.toolbar = this.father.$(this.setting.selector.toolbar)
                    // this.toolbar[1].style.cssText = "display: none;"

                //init style
                var rulerSize = this.setting.rulerSize * this.setting.scaleSize,
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
                console.log(this)
                var inncan = this.inncan,
                    innctx = this.innctx

                inncan.width = this.nowx - this.prex
                inncan.height = this.nowy - this.prey

                innctx.drawImage(this.canvas, this.prex, this.prey, inncan.width, inncan.height, 0, 0, inncan.width, inncan.height)

                this.angle = 0, this.delta = 1

                this.image = new Image()
                this.image.src = inncan.toDataURL("image/png")




                var that = this
                setTimeout(function() {
                    // that._initcanvas()
                    // that.ctx.clearRect(0, 0, that.width, that.height)


                    // that.ctx.drawImage(that.image, that.initx, that.inity, that.image.width, that.image.height)
                    that.initx = (that.width - that.image.width) / 2
                    that.inity = (that.height - that.image.height) / 2
                    that.movex = that.movey = 0
                    that._draw()
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
                console.log(p1, p2, p3, p4)
                innctx.save()
                innctx.beginPath()

                innctx.moveTo(p1.x, p1.y)
                innctx.lineTo(p2.x, p2.y)
                innctx.lineTo(p3.x, p3.y)
                innctx.lineTo(p4.x, p4.y)
                innctx.lineTo(p1.x, p1.y)
                innctx.closePath()
                innctx.clip()
                innctx.fillStyle = "#fff"
                innctx.fillRect(0, 0, this.inncan.width, this.inncan.height)
                innctx.restore()

                this.image = new Image()
                this.image.src = inncan.toDataURL("image/png")
                var that = this
                addEvent("load", function() {
                        that._draw()
                    }, this.image)
                    // this._draw()
            },

            _tmpMatrix: function(xx, yy) {
                var cosd = Math.cos(-this.angle),
                    sind = Math.sin(-this.angle),
                    ix = this.width / 2,
                    iy = this.height / 2
                xx = (xx - ix) / this.delta + ix
                yy = (yy - iy) / this.delta + iy
                return {
                    x: (xx - ix) * cosd - sind * (yy - iy) + ix - this.initx - this.movex,
                    y: sind * (xx - ix) + cosd * (yy - iy) + iy - this.inity - this.movey
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

            _clock: function(op) {
                this._pushState(false)
                this.stack[1].length = 0

                var ctx = this.ctx

                this.angle += Math.PI * this.degree / 180 * (op ? 1 : -1)

                this._draw()
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
                this.image = new Image()
                this.image.src = this.ele.src

                var that = this
                console.log(that)
                addEvent("load", function() {
                    that._initcanvas()
                }, this.image)

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
                    scale = this.setting.scaleSize,
                    width = canvas.width * this.delta / scale,
                    height = canvas.height * this.delta / scale,
                    image = new Image()
                console.log(tmpctx)
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
                console.log(e)
                var x = e.clientX || e.pageX,
                    y = e.clientY || e.clientY
                console.log("??", this.prex)
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

                this.tmpy = this.movey, this.tmpx = this.movex
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

                this.nowx = x <= 0 ? 0 : (x >= this.width ? this.width : x)
                this.nowy = y <= 0 ? 0 : (y >= this.height ? this.height : y)

                if (this.op) this.drawrect()
                else {
                    this._canMove()
                }
            },
            _max: function(a, b, c, d) {
                return Math.max(a, Math.max(b, Math.max(c, Math.max(d))))
            },
            _min: function(a, b, c, d) {
                return Math.min(a, Math.min(b, Math.min(c, Math.min(d))))
            },
            _draw: function() {


                var ctx = this.ctx
                ctx.save()

                ctx.clearRect(0, 0, this.width, this.height)
                ctx.fillStyle = "#fff"

                ctx.translate(this.width / 2, this.height / 2)

                ctx.scale(this.delta, this.delta)
                ctx.rotate(this.angle)
                ctx.translate(-this.width / 2, -this.height / 2)

                ctx.drawImage(this.image, this.initx + this.movex, this.inity + this.movey, this.image.width, this.image.height)

                ctx.restore()
            },
            _canMove: function() {
                var dx = this.nowx - this.prex,
                    dy = this.nowy - this.prey

                this.movex = this.tmpx + dx
                this.movey = this.tmpy + dy

                this._draw()
            },

            _mouseUp: function(e) {

                if (!this.drag || !this.lock) {
                    this.drag = this.lock = this.isblock = false
                    return
                }

                this.drag = this.lock = this.isblock = false

                if (this.op > 0) {
                    // clip is 1
                    this._clip()

                } else if (this.op < 0) {
                    // earase is -1 
                    this._earase()
                } else {

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

                e.preventDefault() || (e.returnValue = false)
                return false
            },

            drawrect: function() {
                var ctx = this.ctx2
                ctx.clearRect(0, 0, this.width, this.height)

                ctx.strokeStyle = "rgb(32, 77, 116)"
                ctx.strokeRect(this.prex, this.prey, this.nowx - this.prex, this.nowy - this.prey)

                // ctx.strokeStyle = "rgb(32, 77, 116)"
                var width = this.nowx - this.prex,
                    height = this.nowy - this.prey,
                    step = [width / 3, height / 3]

                for (var i = 0; i < 2; i++) {
                    for (var j = 1; j < 3; j++) {
                        ctx.beginPath()
                        var x = (i ? 0 : step[i] * j) + this.prex,

                            y = (i ? step[i] * j : 0) + this.prey,
                            w = (i ? width : height)
                        ctx.moveTo(x, y)
                        i ? ctx.lineTo(x + w, y) : ctx.lineTo(x, y + w)
                        ctx.closePath()
                        ctx.stroke()
                    }
                }
            },
            _otoback: function() {
                this.movex = this.movey = 0
                this.delta = 1
                this._draw()
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
                this.oriw = this.image.width
                this.orih = this.image.height
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
                this.drag = false
                this.delta = 1
                this.angle = 0
                this.isblock = false
                this.movex = this.movey = 0

                var init = this._getScale(),
                    base = this.getOffset(this.layer)

                this.baseX = base.x
                this.baseY = base.y
                this.prex = this.prey = 0
                this.nowx = this.nowy = 0
                this.initx = this.originx = init.x
                this.inity = this.originy = init.y

                this.ctx = this.canvas.getContext('2d')
                this.ctx2 = this.floor.getContext('2d')

                this.ctx.clearRect(0, 0, this.width, this.height)
                this.ctx2.clearRect(0, 0, this.width, this.height)

                this.ctx.fillStyle = "#fff"
                this.ctx.clearRect(0, 0, this.width, this.height)
                this.ctx.drawImage(this.image, this.initx, this.inity, this.image.width, this.image.height)

                this.inncan = document.createElement("canvas")
                this.innctx = this.inncan.getContext("2d")

                this._initInn()

            },
            _match: function() {
                // if (!this.match) return
                if (this.match.active) this.block.style.display = "block"
                else this.block.style.display = "none"
            },
            _activeBtn: function(obj) {
                var that = this
                that.op = 0
                this.btn.forEach(function(item) {
                        if (item == obj) return
                        item.active = false
                        item.style.cssText = ""
                        if (item == that.match) that.block.style.display = "none"
                    })
                    // if (!obj) return
                obj.active = !obj.active
                if (obj.active) obj.style.cssText = this.setting.style.active
                else obj.style.cssText = ""
                    // this.btn.forEach(function(item) {
                    //     console.log(item.active, item)
                    // })
            },

            _initEvent: function() {
                var that = this
                this.btn.forEach(function(item) {
                    item.active = false
                })
                addEvent("mousedown", function(e) {
                    console.log(e)
                    that._mouseDown(e)
                })
                addEvent("mousemove", function(e) {
                    that._mouseMove(e)
                })
                addEvent("mouseup", function(e) {
                    that._mouseUp(e)
                })
                addEvent("mousewheel", function(e) {
                    that._mouseScroll(e)
                }, this.layer)

                addEvent("click", function() {

                    that._activeBtn(that.oto)
                    setTimeout(function() {
                        that.oto.style.cssText = ""
                    }, 200)

                    that._otoback()

                }, this.oto)

                addEvent("click", function() {

                    // that._activeBtn(that.oto)
                    // setTimeout(function() {
                    // that.oto.style.cssText = ""
                    // }, 200)

                    that._close()

                }, this.sure)

                addEvent("click", function() {
                    // that.op = 1
                    that._activeBtn(that.clip)
                    if (that.clip.active) that.op = 1
                    else that.op = 0
                }, this.clip)

                addEvent("click", function() {
                    // that.op = -1
                    that._activeBtn(that.earase)
                    if (that.earase.active) that.op = -1
                    else that.op = 0
                }, this.earase)

                addEvent("click", function() {
                    that._activeBtn(that.match)
                    that._match()
                }, this.match)

                addEvent("click", function() {
                    that._activeBtn(that.clock)
                    that._clock(true)

                }, this.clock)
                addEvent("click", function() {
                    that._activeBtn(that.unclock)
                    that._clock(false)

                }, this.unclock)
                addEvent("click", function() {
                    that._activeBtn(that.preStep)
                    setTimeout(function() {
                        that.preStep.style.cssText = ""
                    }, 200)
                    that._step(false)

                }, this.preStep)
                addEvent("click", function() {
                    that._activeBtn(that.nextStep)
                    that._step(true)
                    setTimeout(function() {
                        that.nextStep.style.cssText = ""
                    }, 200)

                }, this.nextStep)

                addEvent("click", function() {
                    that._activeBtn(that.reset)
                    that._reset()
                    setTimeout(function() {
                        that.reset.style.cssText = ""
                    }, 200)
                }, this.reset)
                addEvent("click", function() {
                    that._activeBtn(that.close)
                        // that._close()
                    console.log(that.match)
                    that.match.active = 1
                    that.toolbar[0].style.cssText = "display:none"
                    that.sure.style.display = "block"
                    that.tip.style.display = "block"
                    that._match()

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
            btn: ".btn",
            oto: ".oto", //1:1 btn
            toolbar: ".toolbar",
            sure: ".sure",
            tip: ".tip"
        },
        style: {
            active: "color: #286090; background-color: #fff; border-color: #204d74;"
        },
        scaleSize: 12,
        rulerSize: 12,
        lineweight: 2,
        width: 850,
        height: 515,
        degree: 1,
        step: 5,
        speed: 600 //100-> fast, 1000->slow
    }
})()