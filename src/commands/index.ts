import { Collection } from 'discord.js';
import type { Command } from '../types/command.js';
import { bilgi } from './bilgi.js';
import { temizle } from './temizle.js';
import { ping } from './ping.js';
import { duyuru } from './duyuru.js';
import { profil } from './profil.js';
import { yasakla } from './yasakla.js';
import { at } from './at.js';
import { sustur } from './sustur.js';
import { susturmaKaldir } from './susturma-kaldir.js';
import { uyar } from './uyar.js';
import { uyarSil } from './uyar-sil.js';
import { uyarListe } from './uyar-liste.js';
import { kilitle } from './kilitle.js';
import { kilidiAc } from './kilidi-ac.js';
import { yavasMod } from './yavas-mod.js';
import { oylama } from './oylama.js';
import { avatar } from './avatar.js';
import { uyeSay } from './uye-say.js';
import { ticketSetup } from './ticket-setup.js';
import { kickEkle } from './kick-ekle.js';
import { kickListe } from './kick-liste.js';
import { kickSil } from './kick-sil.js';
import { kelimeOyunuBaslat } from './kelime-oyunu-baslat.js';
import { kelimeOyunuBitir } from './kelime-oyunu-bitir.js';
import { kelimeOyunuDurum } from './kelime-oyunu-durum.js';
import { logAyarla } from './log-ayarla.js';
import { logSifirla } from './log-sifirla.js';
import { ticketArsivTemizle } from './ticket-arsiv-temizle.js';
import { kelimeOyunuSifirla } from './kelime-oyunu-sifirla.js';
import { oynat } from './oynat.js';
import { gec } from './gec.js';
import { durdur } from './durdur.js';
import { duraklat } from './duraklat.js';
import { devam } from './devam.js';
import { kuyruk } from './kuyruk.js';
import { ses } from './ses.js';

export const commands: Command[] = [
  bilgi,
  temizle,
  ping,
  duyuru,
  profil,
  yasakla,
  at,
  sustur,
  susturmaKaldir,
  uyar,
  uyarSil,
  uyarListe,
  kilitle,
  kilidiAc,
  yavasMod,
  oylama,
  avatar,
  uyeSay,
  ticketSetup,
  kickEkle,
  kickListe,
  kickSil,
  kelimeOyunuBaslat,
  kelimeOyunuBitir,
  kelimeOyunuDurum,
  kelimeOyunuSifirla,
  logAyarla,
  logSifirla,
  ticketArsivTemizle,
  oynat,
  gec,
  durdur,
  duraklat,
  devam,
  kuyruk,
  ses,
];

export const commandMap = new Collection<string, Command>(
  commands.map((command) => {
    const data = command.data.toJSON();
    return [data.name, command];
  })
);

