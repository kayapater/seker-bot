import type {
  ChatInputCommandInteraction,
  PermissionResolvable,
} from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

// SlashCommandBuilder'ın tüm varyantlarını kabul eden tip (option eklendikten sonra da çalışır)
type SlashCommandData = SlashCommandBuilder | { toJSON(): any };

export interface Command {
  data: SlashCommandData;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  guildOnly?: boolean;
  requiredClientPermissions?: PermissionResolvable[];
  requiredMemberPermissions?: PermissionResolvable[];
}

