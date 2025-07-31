import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";

import { DecksService } from "./decks.service";
import { PitchDeck } from "../entities/pitch-deck.entity";
import { ProjectsService } from "../projects/projects.service";
import { CreateDeckDto } from "./dto/create-deck.dto";
import { UpdateDeckDto } from "./dto/update-deck.dto";
import { Slide } from "../entities/slide.entity";
import { Project } from "../entities/project.entity";

describe("DecksService", () => {
  let service: DecksService;
  let deckRepository: jest.Mocked<Repository<PitchDeck>>;
  let projectsService: jest.Mocked<ProjectsService>;

  const mockUserId = "user-123";
  const mockProjectId = "project-123";
  const mockDeckId = "deck-123";

  const mockProject: Project = {
    id: mockProjectId,
    name: "Test Project",
    description: "Test Description",
    userId: mockUserId,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    descriptionUpdatedAt: null,
    decks: [],
    contextEvents: [],
    learningPatterns: [],
  };

  const mockSlides: Slide[] = [
    {
      id: "slide-1",
      deckId: mockDeckId,
      title: "Slide 1",
      content: "Content 1",
      speakerNotes: "Notes 1",
      slideType: "cover",
      slideOrder: 1,
      generatedBy: "openai",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      deck: null,
      chatContexts: [],
    },
    {
      id: "slide-2",
      deckId: mockDeckId,
      title: "Slide 2",
      content: "Content 2",
      speakerNotes: "Notes 2",
      slideType: "problem",
      slideOrder: 2,
      generatedBy: "openai",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      deck: null,
      chatContexts: [],
    },
  ];

  const mockDeck: PitchDeck = {
    id: mockDeckId,
    projectId: mockProjectId,
    title: "Test Deck",
    mode: "free",
    generationData: { prompt: "Test prompt" },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    project: mockProject,
    slides: mockSlides,
    versions: [],
    chatContexts: [],
    contextEvents: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecksService,
        {
          provide: getRepositoryToken(PitchDeck),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: ProjectsService,
          useValue: {
            verifyProjectOwnership: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DecksService>(DecksService);
    deckRepository = module.get(getRepositoryToken(PitchDeck));
    projectsService = module.get(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new deck successfully", async () => {
      const createDeckDto: CreateDeckDto = {
        projectId: mockProjectId,
        title: "New Deck",
        mode: "custom",
        generationData: { template: "startup" },
      };

      const createdDeck = { ...mockDeck, ...createDeckDto };

      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);
      deckRepository.create.mockReturnValue(createdDeck);
      deckRepository.save.mockResolvedValue(createdDeck);

      const result = await service.create(createDeckDto, mockUserId);

      expect(projectsService.verifyProjectOwnership).toHaveBeenCalledWith(
        createDeckDto.projectId,
        mockUserId
      );
      expect(deckRepository.create).toHaveBeenCalledWith(createDeckDto);
      expect(deckRepository.save).toHaveBeenCalledWith(createdDeck);
      expect(result).toEqual(createdDeck);
    });

    it("should throw error when project ownership verification fails", async () => {
      const createDeckDto: CreateDeckDto = {
        projectId: mockProjectId,
        title: "New Deck",
        mode: "free",
      };

      projectsService.verifyProjectOwnership.mockRejectedValue(
        new NotFoundException("Project not found")
      );

      await expect(service.create(createDeckDto, mockUserId)).rejects.toThrow(
        NotFoundException
      );

      expect(deckRepository.create).not.toHaveBeenCalled();
      expect(deckRepository.save).not.toHaveBeenCalled();
    });

    it("should handle database errors during creation", async () => {
      const createDeckDto: CreateDeckDto = {
        projectId: mockProjectId,
        title: "New Deck",
        mode: "free",
      };

      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);
      deckRepository.create.mockReturnValue(mockDeck);
      deckRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(service.create(createDeckDto, mockUserId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findOne", () => {
    it("should return deck with sorted slides", async () => {
      const unsortedSlides = [mockSlides[1], mockSlides[0]]; // Wrong order
      const deckWithUnsortedSlides = { ...mockDeck, slides: unsortedSlides };

      deckRepository.findOne.mockResolvedValue(deckWithUnsortedSlides);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);

      const result = await service.findOne(mockDeckId, mockUserId);

      expect(deckRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockDeckId },
        relations: ["project", "slides"],
      });
      expect(projectsService.verifyProjectOwnership).toHaveBeenCalledWith(
        mockProjectId,
        mockUserId
      );
      expect(result.slides[0].slideOrder).toBe(1);
      expect(result.slides[1].slideOrder).toBe(2);
    });

    it("should throw NotFoundException when deck not found", async () => {
      deckRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("non-existent", mockUserId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne("non-existent", mockUserId)).rejects.toThrow(
        "Deck not found"
      );
    });

    it("should throw error when user does not own project", async () => {
      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockRejectedValue(
        new NotFoundException("Access denied")
      );

      await expect(
        service.findOne(mockDeckId, "different-user")
      ).rejects.toThrow(NotFoundException);
    });

    it("should handle deck without slides", async () => {
      const deckWithoutSlides = { ...mockDeck, slides: null };

      deckRepository.findOne.mockResolvedValue(deckWithoutSlides);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);

      const result = await service.findOne(mockDeckId, mockUserId);

      expect(result).toEqual(deckWithoutSlides);
    });

    it("should handle deck with empty slides array", async () => {
      const deckWithEmptySlides = { ...mockDeck, slides: [] };

      deckRepository.findOne.mockResolvedValue(deckWithEmptySlides);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);

      const result = await service.findOne(mockDeckId, mockUserId);

      expect(result.slides).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update deck successfully", async () => {
      const updateDeckDto: UpdateDeckDto = {
        title: "Updated Deck Title",
        generationData: { updated: true },
      };

      const updatedDeck = { ...mockDeck, ...updateDeckDto };

      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);
      deckRepository.save.mockResolvedValue(updatedDeck);

      const result = await service.update(
        mockDeckId,
        updateDeckDto,
        mockUserId
      );

      expect(deckRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDeckDto)
      );
      expect(result).toEqual(updatedDeck);
    });

    it("should throw NotFoundException when deck not found", async () => {
      deckRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update("non-existent", {}, mockUserId)
      ).rejects.toThrow(NotFoundException);
    });

    it("should handle partial updates", async () => {
      const updateDeckDto: UpdateDeckDto = {
        title: "New Title Only",
      };

      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);
      deckRepository.save.mockResolvedValue({ ...mockDeck, ...updateDeckDto });

      const result = await service.update(
        mockDeckId,
        updateDeckDto,
        mockUserId
      );

      expect(result.title).toBe("New Title Only");
      expect(result.mode).toBe(mockDeck.mode); // Should preserve existing values
    });

    it("should handle database errors during update", async () => {
      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);
      deckRepository.save.mockRejectedValue(new Error("Database error"));

      await expect(
        service.update(mockDeckId, { title: "New Title" }, mockUserId)
      ).rejects.toThrow("Database error");
    });
  });

  describe("remove", () => {
    it("should remove deck successfully", async () => {
      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);
      deckRepository.remove.mockResolvedValue(mockDeck);

      await service.remove(mockDeckId, mockUserId);

      expect(deckRepository.remove).toHaveBeenCalledWith(mockDeck);
    });

    it("should throw NotFoundException when deck not found", async () => {
      deckRepository.findOne.mockResolvedValue(null);

      await expect(service.remove("non-existent", mockUserId)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should handle database errors during removal", async () => {
      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);
      deckRepository.remove.mockRejectedValue(new Error("Database error"));

      await expect(service.remove(mockDeckId, mockUserId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getDeckSlides", () => {
    it("should return deck slides", async () => {
      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);

      const result = await service.getDeckSlides(mockDeckId, mockUserId);

      expect(result).toEqual(mockSlides);
    });

    it("should return empty array when deck has no slides", async () => {
      const deckWithoutSlides = { ...mockDeck, slides: [] };

      deckRepository.findOne.mockResolvedValue(deckWithoutSlides);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);

      const result = await service.getDeckSlides(mockDeckId, mockUserId);

      expect(result).toEqual([]);
    });

    it("should handle null slides", async () => {
      const deckWithNullSlides = { ...mockDeck, slides: null };

      deckRepository.findOne.mockResolvedValue(deckWithNullSlides);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);

      const result = await service.getDeckSlides(mockDeckId, mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe("verifyDeckOwnership", () => {
    it("should return deck when user owns it", async () => {
      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockResolvedValue(mockProject);

      const result = await service.verifyDeckOwnership(mockDeckId, mockUserId);

      expect(deckRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockDeckId },
        relations: ["project"],
      });
      expect(projectsService.verifyProjectOwnership).toHaveBeenCalledWith(
        mockProjectId,
        mockUserId
      );
      expect(result).toEqual(mockDeck);
    });

    it("should throw NotFoundException when deck not found", async () => {
      deckRepository.findOne.mockResolvedValue(null);

      await expect(
        service.verifyDeckOwnership("non-existent", mockUserId)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.verifyDeckOwnership("non-existent", mockUserId)
      ).rejects.toThrow("Deck not found");
    });

    it("should throw error when user does not own project", async () => {
      deckRepository.findOne.mockResolvedValue(mockDeck);
      projectsService.verifyProjectOwnership.mockRejectedValue(
        new NotFoundException("Access denied")
      );

      await expect(
        service.verifyDeckOwnership(mockDeckId, "different-user")
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOneForExport", () => {
    it("should return deck with sorted slides for export", async () => {
      const unsortedSlides = [mockSlides[1], mockSlides[0]]; // Wrong order
      const deckWithUnsortedSlides = { ...mockDeck, slides: unsortedSlides };

      deckRepository.findOne.mockResolvedValue(deckWithUnsortedSlides);

      const result = await service.findOneForExport(mockDeckId);

      expect(deckRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockDeckId },
        relations: ["slides"],
      });
      expect(result.slides[0].slideOrder).toBe(1);
      expect(result.slides[1].slideOrder).toBe(2);
    });

    it("should throw NotFoundException when deck not found", async () => {
      deckRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneForExport("non-existent")).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOneForExport("non-existent")).rejects.toThrow(
        "Deck not found"
      );
    });

    it("should handle deck without slides for export", async () => {
      const deckWithoutSlides = { ...mockDeck, slides: null };

      deckRepository.findOne.mockResolvedValue(deckWithoutSlides);

      const result = await service.findOneForExport(mockDeckId);

      expect(result).toEqual(deckWithoutSlides);
    });

    it("should not verify ownership for export (public method)", async () => {
      deckRepository.findOne.mockResolvedValue(mockDeck);

      await service.findOneForExport(mockDeckId);

      expect(projectsService.verifyProjectOwnership).not.toHaveBeenCalled();
    });
  });
});
