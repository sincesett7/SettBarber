# acao.py
import discord
from discord import app_commands, ui
from discord.ext import commands
import os
from dotenv import load_dotenv
from datetime import datetime
import locale

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# --- CONFIGURAÇÃO ---
CANAL_CRIACAO_ID = 1407526694415503430 
CANAL_ACOES_ID = 1407526694415503433 
TOKEN = os.getenv("TOKEN") 

if not TOKEN:
    raise ValueError("Token não encontrado! Verifique seu arquivo .env")

# --- ESTILO E IDENTIDADE VISUAL ---
THUMBNAIL_URL = "https://media.discordapp.net/attachments/1212524436364857395/1414395192928239707/image.png?ex=68bf69ac&is=68be182c&hm=1e54588558b939dd0bc8f690c67fa4ea48e27c806e55915c8172c2eacd61d1c1&=&format=webp&quality=lossless" 
FOOTER_TEXT = "Desenvolvido por SettLabs / By Since"
KUROGUMI_COLOR = 0xE60073
SUCCESS_COLOR = discord.Color.green()
FAIL_COLOR = discord.Color.red()
DEFAULT_COLOR = 0x202225

ICON_RADIO = "📻"
ICON_LEADER = "⭐"
ICON_MEMBERS = "👥"
ICON_RESERVES = "🔄"
ICON_PARTICIPANTS = "💠"
ICON_MONEY = "💰"

# --- HELPER ROBUSTO PARA ENCONTRAR CAMPOS ---
def find_field(embed: discord.Embed, name: str):
    """Encontra um campo pelo nome e retorna seu índice e o objeto."""
    for i, field in enumerate(embed.fields):
        if name in field.name:
            return i, field
    return -1, None

class ActionCreateModal(ui.Modal, title="Criar Nova Ação"):
    action_name = ui.TextInput(label="Nome da Ação", placeholder="Ex: Banco Central", style=discord.TextStyle.short)
    action_radio = ui.TextInput(label="Rádio da Ação", placeholder="Ex: 51", style=discord.TextStyle.short)
    max_members = ui.TextInput(label="Máximo de Membros", placeholder="Ex: 15", style=discord.TextStyle.short)
    max_reserves = ui.TextInput(label="Máximo de Reservas", placeholder="Ex: 2", style=discord.TextStyle.short)

    async def on_submit(self, interaction: discord.Interaction):
        try:
            members_num = int(self.max_members.value)
            reserves_num = int(self.max_reserves.value)
        except ValueError:
            await interaction.response.send_message("O número de membros e reservas deve ser um número válido.", ephemeral=True)
            return

        channel_acoes = interaction.guild.get_channel(CANAL_ACOES_ID)
        if not channel_acoes:
            await interaction.response.send_message("Canal de ações não encontrado. Verifique a configuração.", ephemeral=True)
            return

        leader = interaction.user
        
        embed = discord.Embed(
            title=f"Nova Ação Iniciada",
            description=f"**Ação:** `{self.action_name.value}`",
            color=DEFAULT_COLOR
        )
        if THUMBNAIL_URL:
            embed.set_thumbnail(url=THUMBNAIL_URL)
            
        embed.add_field(name=f"{ICON_RADIO} Rádio da Ação:", value=self.action_radio.value, inline=False)
        embed.add_field(name=f"{ICON_LEADER} Responsável pela Ação:", value=f"{leader.mention}", inline=False)
        embed.add_field(name=f"{ICON_MEMBERS} Membros na Ação:", value=f"1/{members_num}", inline=True)
        embed.add_field(name=f"{ICON_RESERVES} Reservas na Ação:", value=f"0/{reserves_num}", inline=True)
        embed.add_field(name=f"{ICON_PARTICIPANTS} Participantes:", value=f"{leader.mention}", inline=True)
        embed.add_field(name=f"{ICON_PARTICIPANTS} Reservas:", value="Nenhum reserva ainda", inline=True)
        
        embed.set_footer(text=f"ID do Líder: {leader.id} • {FOOTER_TEXT}")

        view = ActionControlView()
        await channel_acoes.send(embed=embed, view=view)
        await interaction.response.send_message(f"Ação `{self.action_name.value}` criada com sucesso no canal {channel_acoes.mention}!", ephemeral=True)


class ActionResultModal(ui.Modal, title="Resultado da Ação"):
    def __init__(self, message: discord.Message):
        super().__init__()
        self.message = message

    result = ui.TextInput(label="Resultado (digite 'Ganhou' ou 'Perdeu')", placeholder="ganhou / perdeu", required=True)
    value_won = ui.TextInput(label="Valor Ganho", placeholder="Ex: 100000 ou 0", required=False)

    async def on_submit(self, interaction: discord.Interaction):
        resultado = self.result.value
        valor = self.value_won.value
        
        old_embed = self.message.embeds[0]
        action_name_from_desc = old_embed.description.split('`')[1]

        try:
            valor_num = float(valor) if valor else 0
            valor_formatado_br = f"{valor_num:,.2f}".replace(",", "#").replace(".", ",").replace("#", ".")
            valor_formatado = f"R$ {valor_formatado_br}"
        except ValueError:
            valor_formatado = "R$ 0,00"

        if resultado.strip().lower() == "ganhou":
            new_embed = discord.Embed(title="✅ Ação Finalizada: Vitória", description=f"**Ação:** `{action_name_from_desc}`", color=SUCCESS_COLOR, timestamp=datetime.now())
        else:
            new_embed = discord.Embed(title="❌ Ação Finalizada: Derrota", description=f"**Ação:** `{action_name_from_desc}`", color=FAIL_COLOR, timestamp=datetime.now())
        
        if THUMBNAIL_URL:
            new_embed.set_thumbnail(url=THUMBNAIL_URL)
        
        _, responsavel_field = find_field(old_embed, "Responsável")
        _, participantes_field = find_field(old_embed, "Participantes")
        _, reservas_field = find_field(old_embed, "Reservas:") # Busca específica

        if responsavel_field: new_embed.add_field(name=responsavel_field.name, value=responsavel_field.value, inline=False)
        if participantes_field: new_embed.add_field(name=participantes_field.name, value=participantes_field.value, inline=True)
        if reservas_field: new_embed.add_field(name=reservas_field.name, value=reservas_field.value, inline=True)
        
        new_embed.add_field(name=f"{ICON_MONEY} Valor:", value=valor_formatado, inline=False)
        new_embed.set_footer(text=FOOTER_TEXT)

        await self.message.edit(embed=new_embed, view=None)
        await interaction.response.send_message("Ação finalizada com sucesso!", ephemeral=True)


class ActionControlView(ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    def get_leader_id(self, embed: discord.Embed) -> int:
        try:
            id_part = embed.footer.text.split('•')[0].strip()
            leader_id = int(id_part.split(': ')[1])
            return leader_id
        except (IndexError, ValueError):
            return 0 

    @ui.button(label="Participar/Sair", style=discord.ButtonStyle.primary, custom_id="participate_button")
    async def participate(self, interaction: discord.Interaction, button: ui.Button):
        embed = interaction.message.embeds[0]
        user = interaction.user

        membros_idx, membros_field = find_field(embed, "Membros na Ação")
        reservas_idx, reservas_field = find_field(embed, "Reservas na Ação")
        participantes_idx, participantes_field = find_field(embed, "Participantes")
        
        # --- CORREÇÃO APLICADA AQUI ---
        # A busca agora é mais específica para o campo da lista de reservas
        reservas_lista_idx, reservas_lista_field = find_field(embed, f"{ICON_PARTICIPANTS} Reservas:")

        if any(f is None for f in [membros_field, reservas_field, participantes_field, reservas_lista_field]):
            return await interaction.response.send_message("ERRO: A estrutura da embed está corrompida.", ephemeral=True)

        max_members = int(membros_field.value.split('/')[1])
        max_reserves = int(reservas_field.value.split('/')[1])
        
        participants_list = participantes_field.value.split('\n')
        reserves_list = []
        if "Nenhum" not in reservas_lista_field.value:
            reserves_list = reservas_lista_field.value.split('\n')

        if user.mention in participants_list:
            leader_id = self.get_leader_id(embed)
            if user.id == leader_id:
                return await interaction.response.send_message("Você é o líder e não pode sair da ação.", ephemeral=True)
            participants_list.remove(user.mention)
            if reserves_list:
                participants_list.append(reserves_list.pop(0))
            await interaction.response.send_message("Você saiu da ação.", ephemeral=True)
        elif user.mention in reserves_list:
            reserves_list.remove(user.mention)
            await interaction.response.send_message("Você saiu da lista de reservas.", ephemeral=True)
        else:
            if len(participants_list) < max_members:
                participants_list.append(user.mention)
                await interaction.response.send_message("Você entrou na ação!", ephemeral=True)
            elif len(reserves_list) < max_reserves:
                reserves_list.append(user.mention)
                await interaction.response.send_message("Você entrou na lista de reservas.", ephemeral=True)
            else:
                return await interaction.response.send_message("A ação e a lista de reservas já estão cheias.", ephemeral=True)
        
        embed.set_field_at(membros_idx, name=membros_field.name, value=f"{len(participants_list)}/{max_members}", inline=True)
        embed.set_field_at(reservas_idx, name=reservas_field.name, value=f"{len(reserves_list)}/{max_reserves}", inline=True)
        embed.set_field_at(participantes_idx, name=participantes_field.name, value='\n'.join(participants_list), inline=True)
        embed.set_field_at(reservas_lista_idx, name=reservas_lista_field.name, value='\n'.join(reserves_list) if reserves_list else "Nenhum reserva ainda", inline=True)
        
        await interaction.message.edit(embed=embed)

    @ui.button(label="Finalizar Ação", style=discord.ButtonStyle.success, custom_id="finish_button")
    async def finish(self, interaction: discord.Interaction, button: ui.Button):
        leader_id = self.get_leader_id(interaction.message.embeds[0])
        if interaction.user.id != leader_id:
            return await interaction.response.send_message("Apenas o responsável pela ação pode finalizá-la.", ephemeral=True)
        await interaction.response.send_modal(ActionResultModal(message=interaction.message))

class CreateButtonView(ui.View):
    def __init__(self):
        super().__init__(timeout=None) 

    @ui.button(label="Criar Ação", style=discord.ButtonStyle.blurple, custom_id="create_action_button")
    async def create(self, interaction: discord.Interaction, button: ui.Button):
        await interaction.response.send_modal(ActionCreateModal())

class MyBot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix="!", intents=discord.Intents.default())

    async def setup_hooks(self):
        self.add_view(ActionControlView())
        self.add_view(CreateButtonView()) 

    async def on_ready(self):
        print(f'Bot {self.user} está online!')
        await self.setup_creator_panel()
        print('------')

    async def setup_creator_panel(self):
        channel = self.get_channel(CANAL_CRIACAO_ID)
        if not channel:
            print(f"ERRO: Canal de criação com ID {CANAL_CRIACAO_ID} não encontrado.")
            return

        async for message in channel.history(limit=50):
            if message.author == self.user and message.embeds:
                if message.embeds[0].title == "Painel de Criação de Ações":
                    print("Painel de criação já existe.")
                    return 

        print("Painel de criação não encontrado, criando um novo...")
        embed = discord.Embed(
            title="Painel de Criação de Ações",
            description="Utilize o botão abaixo para iniciar o planejamento de uma nova ação para a **Kurogumi**.",
            color=KUROGUMI_COLOR
        )
        if THUMBNAIL_URL:
            embed.set_thumbnail(url=THUMBNAIL_URL)
        embed.set_footer(text=FOOTER_TEXT)
        
        await channel.send(embed=embed, view=CreateButtonView())
        print("Painel de criação enviado com sucesso.")

bot = MyBot()
bot.run(TOKEN)