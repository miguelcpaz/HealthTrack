-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "status_senha" INTEGER NOT NULL DEFAULT 0,
    "cpf" TEXT NOT NULL,
    "crm" TEXT,
    "tipo_user" INTEGER NOT NULL,
    "hospitalId" INTEGER NOT NULL,
    "status_cadastro" TEXT NOT NULL DEFAULT 'pendente',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Hospital" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cnes" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "status_senha" INTEGER NOT NULL DEFAULT 0,
    "website" TEXT,
    "tipoEstabelecimento" TEXT NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Paciente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "idade" INTEGER,
    "sexo" TEXT,
    "nivelalerta" TEXT NOT NULL,
    "relatorio" TEXT,
    "prescricao" TEXT,
    "estadia" INTEGER,
    "quarto" INTEGER,
    "hospitalId" INTEGER NOT NULL,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Solicitation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "hospitalId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "public"."User"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_cnpj_key" ON "public"."Hospital"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_cnes_key" ON "public"."Hospital"("cnes");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_email_key" ON "public"."Hospital"("email");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "public"."Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paciente" ADD CONSTRAINT "Paciente_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "public"."Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Solicitation" ADD CONSTRAINT "Solicitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Solicitation" ADD CONSTRAINT "Solicitation_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "public"."Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
