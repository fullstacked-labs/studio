# Sound: beats, cues, sync, loudness

## The grid

`scripts/beats.py <track.mp3> analysis/<product>/beat_data.json` (run with
`uv run --with librosa --with scipy --python 3.11`) fits a line through librosa's beat
times. librosa's tempo scalar alone can be 2 % off, which is a full beat by bar 12;
always use the fitted `T` and `t0`. Look at the per-beat `rms` to find the track's
quiet bars, drops and dips before writing the timeline, and put the film's big
moments on them (devhop: the drop lands on Enter, the dip bar on the logo).

Music and effects are Mixkit files from video-shotcraft; `node scripts/audio.mjs`
copies them into `captures/audio/`, which is gitignored because Mixkit's license
covers rendered video, not redistributing the files.

## Cues

A `Cue` has `at` (the beat its peak should land on) and `peak` (seconds into the
file where its peak sits, measured once per file). The cue starts `peak` early.
`OUTPUT_AUDIO_OFFSET_SEC` is 0 at Remotion 4.0.539: that was measured on a decode
of the MP4. A raw `.aac` dump keeps the encoder's priming and reads ~45 ms late;
measuring on one once shipped a film with every sound 45 ms early.

Rules that held up:

- One sound per kind of action, all film long (every tap is `switch-tap`, every hop
  `whoosh-fast`). Rapid repeats alternate two samples and step the volume down
  (`keys()` in timeline.ts).
- The music is quieter under the problem than after the drop (`Sound`'s volume
  curve), so the drop is felt.
- Re-pin every cue after the picture changes: cues are beats, but an action that
  moved by a sixteenth moves its cue too.

## Sync check

```bash
node scripts/sync.mjs out/long.mp4 --grid devhop --beats "⌘V=19,⌘S=20.25,corner=74"
```

It decodes the MP4 and reports each cue's onset drift; exit 1 beyond ±10 ms. With
the music in, a cue under a louder music hit can lock onto the music: confirm a
bad number on a `--props='{"bgm":false}'` render before moving the cue.

## Loudness and export

```bash
node scripts/export.mjs DevhopDemo exports/devhop/demo --nobgm --avif --poster 1480
```

Two-pass `loudnorm` in linear mode to -14 LUFS, then a limiter. The AAC encoder
overshoots the limiter by up to 2 dB (a WAV measured -1.5 dBTP, the same audio in
AAC +0.5 dBTP), so the script lowers the ceiling until the encoded file measures
≤ -1.5 dBTP. The no-music version gets the main file's gain rather than its own
normalization, which would blow the effects up to -14 LUFS. AVIF is encoded from
PNG frames, never from the h264, whose chroma blur AV1 would keep.
