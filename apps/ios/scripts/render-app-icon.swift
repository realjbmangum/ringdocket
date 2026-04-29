#!/usr/bin/env swift

// Renders the Ringdocket iOS app icon as a 1024x1024 opaque PNG.
//
// Design (per docs/brand/03-visual-identity.md):
//   - "R." treatment derived from the wordmark
//   - Background: surface-paper #F7F3EA
//   - "R" letterform: ink-primary #1B1F27, heavy weight
//   - Period: accent-signal #C2370A, the brand's stamp
//   - 2px hairline rule near the bottom — paper-record metaphor
//
// Why no transparency: Apple rejects icons with alpha channels. We
// render through a CGContext with kCGImageAlphaNoneSkipLast so the
// encoded PNG has no alpha plane.
//
// Why system font: Bricolage Grotesque isn't a system face on macOS;
// SF Pro Display Black is a faithful enough proxy at icon scale.
//
// Run: swift apps/ios/scripts/render-app-icon.swift

import AppKit
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers

let size = 1024
let outputPath = "/Users/jbm/new-project/app-spamblocker/ringdocket/apps/ios/Ringdocket/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"

let colorSpace = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(
    data: nil,
    width: size,
    height: size,
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
) else {
    fputs("Failed to create CGContext\n", stderr)
    exit(1)
}

let surfacePaper = CGColor(red: 0.969, green: 0.953, blue: 0.918, alpha: 1)
let inkPrimary = CGColor(red: 0.106, green: 0.122, blue: 0.153, alpha: 1)
let accentSignal = CGColor(red: 0.761, green: 0.216, blue: 0.039, alpha: 1)
let ruleColor = CGColor(red: 0.847, green: 0.816, blue: 0.745, alpha: 1)

// Paper background.
ctx.setFillColor(surfacePaper)
ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))

// "R" + period drawn with Core Text. Use SF Pro Display Black at a
// large size so the glyphs fill the icon canvas with proper kerning.
let fontSize: CGFloat = 720
let fontDescriptor = CTFontDescriptorCreateWithAttributes([
    kCTFontFamilyNameAttribute: "SF Pro Display",
    kCTFontWeightTrait: NSNumber(value: 0.62),  // ~black weight
] as CFDictionary)
let font = CTFontCreateWithFontDescriptor(fontDescriptor, fontSize, nil)

func attributedString(_ s: String, color: CGColor, kern: CGFloat = 0) -> CFAttributedString {
    let attrs: [NSAttributedString.Key: Any] = [
        .font: font,
        .foregroundColor: color,
        .kern: NSNumber(value: Double(kern)),
    ]
    return NSAttributedString(string: s, attributes: attrs) as CFAttributedString
}

let rString = attributedString("R", color: inkPrimary, kern: -10)
let periodString = attributedString(".", color: accentSignal)

let rLine = CTLineCreateWithAttributedString(rString)
let periodLine = CTLineCreateWithAttributedString(periodString)

let rBounds = CTLineGetBoundsWithOptions(rLine, .useOpticalBounds)
let periodBounds = CTLineGetBoundsWithOptions(periodLine, .useOpticalBounds)

// Layout: center the combined "R." horizontally, optical-vertical
// align so the icon doesn't look bottom-heavy.
let kerning: CGFloat = -20
let totalWidth = rBounds.width + kerning + periodBounds.width
let originX = (CGFloat(size) - totalWidth) / 2 - rBounds.minX
// CTLine baseline math: y is the baseline. Center the cap-height
// then nudge up because periods sit on the baseline (no descender weight).
let baselineY = (CGFloat(size) - rBounds.height) / 2 - rBounds.minY + 30

ctx.textPosition = CGPoint(x: originX, y: baselineY)
CTLineDraw(rLine, ctx)

ctx.textPosition = CGPoint(x: originX + rBounds.width + kerning, y: baselineY)
CTLineDraw(periodLine, ctx)

// Hairline rule near the bottom — 2px, rule-color, ~70% width centered.
let ruleY: CGFloat = 90
let ruleHeight: CGFloat = 2
let ruleWidth: CGFloat = CGFloat(size) * 0.7
let ruleX: CGFloat = (CGFloat(size) - ruleWidth) / 2
ctx.setFillColor(ruleColor)
ctx.fill(CGRect(x: ruleX, y: ruleY, width: ruleWidth, height: ruleHeight))

// Encode to PNG.
guard let image = ctx.makeImage() else {
    fputs("Failed to create CGImage from context\n", stderr)
    exit(1)
}

let outputURL = URL(fileURLWithPath: outputPath)
guard let dest = CGImageDestinationCreateWithURL(
    outputURL as CFURL,
    UTType.png.identifier as CFString,
    1,
    nil
) else {
    fputs("Failed to create image destination\n", stderr)
    exit(1)
}
CGImageDestinationAddImage(dest, image, nil)
guard CGImageDestinationFinalize(dest) else {
    fputs("Failed to write PNG\n", stderr)
    exit(1)
}

let attrs = try? FileManager.default.attributesOfItem(atPath: outputPath)
let bytes = (attrs?[.size] as? Int) ?? 0
print("Wrote \(bytes) bytes to \(outputPath)")
