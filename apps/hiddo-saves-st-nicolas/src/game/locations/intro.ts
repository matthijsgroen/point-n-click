import g from "../game";

/**
 * https://www.typescriptlang.org/play/?#code/C4TwDgpgBAygxhAdhAQgQzgawOYCcD2ArogCZQC8UA3gFBRQBmaJEAkogFxQAUAlBQD4oAN3wBLEnSgBnABb4A7lz6CR4yQF8aNUJCgBxNAFsIAdXy4ANmUq16cWWlwZgEXNK4AlCHAskAPNLAuGKI2AA01FL0QWiuHlDevrgBQSFhkWmh2ALRjJZo2AlZYVIauVo64NCGJgAiEAyhYsBi+Ij+ACq10BAAHq6k0gbGZhbWQpTdo9q6NaMUI-WNza3t-nZQDk4ubgmb9LISJPhcB-QywHEQ+3kXUEZEwLJcAER4oa9QAD5Qr1eWTCvO4XCAgG5vSyNYBfX6vABGllCQJ+fzglnw0ggJFhf3wkEQuNeIWwshhqNehDARJOCkJIPoTiMCVe0gkEBpjTQhEsMJBGnCIIYBSKbzE0hQlkIcmyRMc0n0BWkWOkwPuAryACtQq4ziDYvE9fd7o9CM9IdzSUTpMw1cb6GCIX8oQxyXDEciiejMdiifikESSWSiVSaYp6fbGbhmW82SxOUweXz7Rr7cLCizxZLpUcwnK0AqlSq7fQtKWaOVZtUoHVxWACiAAMKOZxwVy4Lo9KD9QYkYY9cxWEiRTrNnZttzdgZIPtQTBg-AMKDTEwAbVe21b7dVAF1JlF6GAfcoj1iuAAFJytNCWTujdeb3buV471ejltP1+sq7xF8CSLpkUAD8ZxQKuADSUChMuPQPh+E7Pq+77ju2X6AbuO4gVA8L4PgUJoIgUAaPw5BCKIEgVlWejwEgEAABIQJYkAdiuvTTkMSxjEO+6bCwTTIOgWB4EQpDKGIRiFBAACCyoQMAACqVhcCU2AkUINECRgOAEMQkj0NgcljlubhcF0RlPlOvbDPOICLjB94bvB25-twj4IVwyHGbgak1nWDbmQhd4mCOAXthUVHzPUMAADJBWxVmcYOEyLJsWLAFSGkQKZnSZd40hJgI3CyIxzHKNICAmFwmUMUxbhxQIPk5QgyB5UmjW5TcSaUTQviIEEUAKOMNhQHFlkzv2oxJSQhW8FwPR1DF9WqJsvX9WlGXNdAlBdB1+W8uEhV8asbScDw3AJNVJV1axDWqE1tGtbyvCzcuu1JsteSrcAUDFbVuBVZtNXMUttggkdmlCTpok8IQVg+dw5z3EwLDsMoPlUERgqRjI8hKDw6NEfyvBY8aBnAKFJkjZ5Fk9uNc4LkurFwShewuW57YeRT3kfdjuBybDhGI8ap5ZTwIsXleYg3nFzNebub5c1+Bo3H+AEitIWEYxBUGEUzjks4hCtOW4aHqy+mFcDheEQARRHo9o2PltjZbGi7TsXHz6W4IR4MtCdRVXd5ZQO1AnsC9QMj82AmWE5UX1QNgCyUINQ7+D0M3aPHGNHCQJyRNqiCuJE8JacJulEYsicmAAdOt0ebdw53w5sJeQyJJDKdX4OoKXUMkNwlJWMu+BQIJ2nt68xNSDnJyd2TXMDzP+CTyTBe6jI1fz8buAD2vHK8BWz3aEv1ciwjDxPC8fwfISds0Hvp8+ufprms6lqyF8xFAA
 */

g.defineLocation("home", {
  describe: (w) => {
    const { player: hiddo, jinte } = w.characters;

    // Add some code I wish I had
    const { hiddoC, background } = w.setupScene((scene) => ({
      background: scene.get("background", 0, [0, 0], {
        state: { image: "lawn" },
      }),
      hiddoC: scene.get("hiddo", 1, [0.2, 0.8]),
    }));

    background.show();
    hiddoC.show();
    hiddoC.pose("normal");
    // jinteCharacter.show();

    hiddo.say("Mam, het gaat beginnen!");
    jinte.say("Hoofdpiet is op de TV!");

    w.scenes.tvIntro.play();

    jinte.say("Mam! We moeten Sinterklaas helpen!");
    hiddo.say("Ze zoeken kinderen om te helpen voorbereiden voor pakjesavond!");
    hiddo.say("Onze.... {i}slik{/i} kadootjes staan op het spel!");
    hiddoC.pose("shocked");

    w.locations.lawn.travel();
  },

  onLeaveToLawn: (w) => {
    // Describe text
    w.text("Je springt in de auto en je moeder rijd snel naar het Pietenhuis.");
  },
});
