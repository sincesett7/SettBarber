import discord
from discord.ext import commands
from discord.ui import Button, View, Modal, TextInput
import os
from dotenv import load_dotenv

# --- CONFIGURAÇÃO ---
load_dotenv()
TOKEN = os.getenv('TOKEN')
GUILD_ID = 1407526687440109588
CANAL_PEDIDO_ID = 1413549081103437905
CANAL_APROVACAO_ID = 1413549109435957419
CARGO_APROVADO_ID = 1407526687461216438

# FORMATO DO APELIDO AJUSTADO PARA #ID・NOME
FORMATO_APELIDO = "#{id}・{nome}"

# URL da logo da Kurogumi para a embed
# ATENÇÃO: Links de anexo do Discord podem expirar. Para uso definitivo,
# é recomendado hospedar a imagem em um serviço como Imgur.
KUROGUMI_LOGO_URL = "https://media.discordapp.net/attachments/1212524436364857395/1414395192928239707/image.png?ex=68bf69ac&is=68be182c&hm=1e54588558b939dd0bc8f690c67fa4ea48e27c806e55915c8172c2eacd61d1c1&=&format=webp&quality=lossless"

intents = discord.Intents.default()
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

# --- UI Classes ---
class ModalPedidoSet(Modal):
    def __init__(self):
        super().__init__(title="Formulário de Pedido de Set (Kurogumi)")

        self.nome = TextInput(label="Nome", placeholder="Nome in Game", required=True)
        self.id_usuario = TextInput(label="ID", placeholder="ID in Game", required=True)
        self.numero = TextInput(label="Número", placeholder="Número in Game", required=True)
        self.recrutador = TextInput(label="Recrutador", placeholder="Quem te trouxe para a Kurogumi?", required=True)

        self.add_item(self.nome)
        self.add_item(self.id_usuario)
        self.add_item(self.numero)
        self.add_item(self.recrutador)

    async def on_submit(self, interaction: discord.Interaction):
        canal_aprovacao = bot.get_channel(CANAL_APROVACAO_ID)
        if not canal_aprovacao:
            return await interaction.response.send_message("Erro: Canal de aprovação não encontrado. Por favor, contate a administração.", ephemeral=True)

        nome = self.nome.value
        id_usuario = self.id_usuario.value
        numero = self.numero.value
        recrutador = self.recrutador.value

        embed_aprovacao = discord.Embed(
            title="🐉 Novo Pedido de Set - Kurogumi",
            description=f"Um novo membro solicitou o Set da Kurogumi. Por favor, analise as informações abaixo.",
            color=0xFF0066 # Um rosa vibrante que combina com a logo
        )
        embed_aprovacao.set_thumbnail(url=KUROGUMI_LOGO_URL) # Adiciona a logo como thumbnail
        embed_aprovacao.add_field(name="👤 Nome", value=nome, inline=False)
        embed_aprovacao.add_field(name="🆔 ID", value=id_usuario, inline=False)
        embed_aprovacao.add_field(name="📞 Número", value=numero, inline=False)
        embed_aprovacao.add_field(name="🤝 Recrutador", value=recrutador, inline=False)
        
        embed_aprovacao.set_footer(text=f"Solicitado por: {interaction.user.display_name} | ID: {interaction.user.id}")

        await canal_aprovacao.send(embed=embed_aprovacao, view=ViewAprovacao())
        await interaction.response.send_message("✅ Seu pedido para a Kurogumi foi enviado para análise! Aguarde a aprovação.", ephemeral=True)


class ViewAprovacao(View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Aceitar", style=discord.ButtonStyle.green, custom_id="aceitar_set")
    async def aceitar_button_callback(self, interaction: discord.Interaction, button: Button):
        if not interaction.user.guild_permissions.manage_roles:
            return await interaction.response.send_message("Você não tem permissão para gerenciar sets da Kurogumi.", ephemeral=True)
            
        await interaction.response.defer()

        original_embed = interaction.message.embeds[0]
        footer_text = original_embed.footer.text
        solicitante_id_str = footer_text.split("ID: ")[1] if "ID: " in footer_text else None
        solicitante_id = int(solicitante_id_str) if solicitante_id_str else None

        if not solicitante_id:
            return await interaction.followup.send("Erro: Não foi possível encontrar o ID do solicitante na embed.", ephemeral=True)

        membro = interaction.guild.get_member(solicitante_id)
        if not membro:
            return await interaction.followup.send("Erro: Membro não encontrado no servidor. Ele pode ter saído.", ephemeral=True)

        # CORREÇÃO: Pega o valor dos campos usando os nomes corretos
        nome_solicitante = next((field.value for field in original_embed.fields if "👤 Nome" in field.name), "N/A")
        id_solicitante = next((field.value for field in original_embed.fields if "🆔 ID" in field.name), "N/A")
        
        # O número não é usado no apelido, então não é necessário
        # numero_solicitante = next((field.value for field in original_embed.fields if "📞 Número" in field.name), "N/A")
        
        cargo = interaction.guild.get_role(CARGO_APROVADO_ID)
        if cargo:
            await membro.add_roles(cargo)
        
        try:
            # Apelido formatado, usando apenas nome e ID
            novo_apelido = FORMATO_APELIDO.format(nome=nome_solicitante, id=id_solicitante)
            await membro.edit(nick=novo_apelido)
        except Exception as e:
            await interaction.followup.send(f"Erro ao tentar alterar apelido do membro: {e}. Por favor, ajuste as permissões.", ephemeral=True)
            return
        
        embed_aceita = original_embed.copy()
        embed_aceita.title = "✅ Pedido de Set APROVADO - Kurogumi"
        embed_aceita.description = f"O pedido de {membro.mention} foi **APROVADO**!"
        embed_aceita.color = discord.Color.green()
        embed_aceita.add_field(name="Aprovado por", value=interaction.user.mention, inline=False)
        embed_aceita.set_footer(text=f"Aprovado por {interaction.user.display_name} | Desenvolvido por SettLabs / By Since")
        
        self.clear_items()
        
        await interaction.message.edit(embed=embed_aceita, view=self)
        await interaction.followup.send(f"✅ Pedido de {membro.mention} para o Set da Kurogumi foi aprovado!", ephemeral=False)

    @discord.ui.button(label="Recusar", style=discord.ButtonStyle.red, custom_id="recusar_set")
    async def recusar_button_callback(self, interaction: discord.Interaction, button: Button):
        if not interaction.user.guild_permissions.manage_roles:
            return await interaction.response.send_message("Você não tem permissão para gerenciar sets da Kurogumi.", ephemeral=True)
        
        await interaction.response.defer()

        original_embed = interaction.message.embeds[0]
        
        embed_recusada = original_embed.copy()
        embed_recusada.title = "❌ Pedido de Set RECUSADO - Kurogumi"
        embed_recusada.description = f"O pedido foi **RECUSADO**."
        embed_recusada.color = discord.Color.red()
        embed_recusada.add_field(name="Recusado por", value=interaction.user.mention, inline=False)
        embed_recusada.set_footer(text=f"Recusado por {interaction.user.display_name} | Desenvolvido por SettLabs / By Since")

        self.clear_items()

        await interaction.message.edit(embed=embed_recusada, view=self)
        await interaction.followup.send("❌ Pedido recusado.", ephemeral=False)


class ViewPedidoInicial(View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Solicitar Set Kurogumi", style=discord.ButtonStyle.primary, custom_id="pedir_set_inicial", emoji="📝")
    async def button_callback(self, interaction: discord.Interaction, button: Button):
        await interaction.response.send_modal(ModalPedidoSet())

# --- EVENTOS E COMANDOS DO BOT ---
@bot.event
async def on_ready():
    print(f'Bot conectado como {bot.user}')

    canal_pedido = bot.get_channel(CANAL_PEDIDO_ID)
    if canal_pedido:
        embed_inicial = discord.Embed(
            title="👑 Bem-vindo à Kurogumi! - Solicite seu Set",
            description=(
                "Por favor, clique no botão abaixo e preencha o formulário de solicitação de Set. "
                "Após o envio, iremos analisar suas informações."
            ),
            color=0xFF0066
        )
        embed_inicial.set_author(name="Sistema de Registro Kurogumi", icon_url=KUROGUMI_LOGO_URL)
        embed_inicial.set_thumbnail(url=KUROGUMI_LOGO_URL)
        embed_inicial.add_field(name="Passos:", value="1. Clique em 'Solicitar Set Kurogumi'.\n2. Preencha o formulário com seus dados.\n3. Aguarde a aprovação.", inline=False)
        embed_inicial.set_footer(text="Desenvolvido por SettLabs / By Since")
        
        mensagens = []
        try:
            async for m in canal_pedido.history(limit=50):
                mensagens.append(m)
        except discord.errors.Forbidden:
            print(f"Erro: Não tenho permissão para ler o histórico do canal {CANAL_PEDIDO_ID}. Verifique as permissões.")
            return

        # Esta lógica está correta e vai criar a view necessária na mensagem
        if not any(m.embeds and m.embeds[0].title and "Bem-vindo à Kurogumi" in m.embeds[0].title for m in mensagens):
            await canal_pedido.send(embed=embed_inicial, view=ViewPedidoInicial())
            print(f"Mensagem inicial de Set enviada para o canal: {canal_pedido.name}")
        else:
            print("Mensagem inicial de Set já existe no canal. Não enviei uma nova.")
    else:
        print(f"Canal de pedido com ID {CANAL_PEDIDO_ID} não encontrado. Verifique se o ID está correto.")

# --- INICIA O BOT ---
bot.run(TOKEN)